import * as Yup from "yup";

import { AUTH_TYPE_SCHEMAS } from "./Fields/authTypeSchemas";
import { FieldName, type FormFields } from "./Fields/types";
import { getCloudType } from "./Fields/utils";

export const EMPTY_FORM_FIELDS: FormFields = {
  [FieldName.NAME]: "",
  [FieldName.CLOUD]: "",
  [FieldName.REGION]: "",
  [FieldName.AUTH_TYPE]: "",
  [FieldName.AUTH_ATTRS]: {},
};

/**
 * Helper function to validate JSON strings.
 */
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build validation schema for auth fields based on cloud and auth type.
 * Returns a Yup schema shape that can be spread into a larger schema.
 */
export function getAuthFieldsSchema(
  cloud: string,
  authType: string,
): Record<string, Yup.AnySchema> {
  const cloudType = getCloudType(cloud);
  const schema = AUTH_TYPE_SCHEMAS[cloudType as keyof typeof AUTH_TYPE_SCHEMAS];
  const fields =
    schema?.authTypes?.[authType as keyof typeof schema.authTypes] ?? [];

  return fields.reduce<Record<string, Yup.AnySchema>>((acc, field) => {
    let validator: Yup.AnySchema = Yup.string();

    // Add required validation
    if (!field.optional) {
      validator = (validator as Yup.StringSchema).required("Required");
    }

    // Add format-specific validators
    if (field.format === "email") {
      validator = (validator as Yup.StringSchema).email("Invalid email format");
    } else if (field.format === "uuid") {
      validator = (validator as Yup.StringSchema).uuid("Invalid UUID format");
    } else if (field.format === "json") {
      validator = (validator as Yup.StringSchema).test(
        "valid-json",
        "Must be valid JSON",
        (value) => !value || isValidJSON(value),
      );
    }
    // Note: 'pem' format is not validated here, it's accepted as plain text

    acc[field.name] = validator;
    return acc;
  }, {});
}

/**
 * Validate form fields including base fields and auth fields.
 */
export function validateFormFields(values: FormFields): FormFields {
  const errors: FormFields = { ...EMPTY_FORM_FIELDS };

  // Base field validation
  if (!values[FieldName.NAME]) {
    errors[FieldName.NAME] = "Required";
  }
  if (!values[FieldName.CLOUD]) {
    errors[FieldName.CLOUD] = "Required";
  }
  if (!values[FieldName.AUTH_TYPE]) {
    errors[FieldName.AUTH_TYPE] = "Required";
  }

  // Auth fields validation
  const authFieldsSchema = getAuthFieldsSchema(values.cloud, values.authType);
  const authAttrsErrors: Record<string, string> = {};

  Object.entries(authFieldsSchema).forEach(([fieldName, schema]) => {
    try {
      schema.validateSync(values[FieldName.AUTH_ATTRS][fieldName]);
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        authAttrsErrors[fieldName] = err.message;
      }
    }
  });

  if (Object.keys(authAttrsErrors).length > 0) {
    errors[FieldName.AUTH_ATTRS] = authAttrsErrors;
  }

  return errors;
}
