import { FormikField, Select, Textarea } from "@canonical/react-components";
import { useFormikContext } from "formik";
import type { ChangeEvent, JSX } from "react";
import { useEffect, useMemo } from "react";

import { getCloudInfoState } from "store/juju/selectors";
import { useAppSelector } from "store/store";

import { AUTH_TYPE_SCHEMAS } from "./authTypeSchemas";
import { Label, FieldName, type FormFields } from "./types";
import {
  toCloudOptions,
  toRegionOptions,
  toAuthTypeOptions,
  getCloudType,
} from "./utils";

const Fields = (): JSX.Element => {
  const { values, setFieldValue } = useFormikContext<FormFields>();
  const { clouds } = useAppSelector(getCloudInfoState);

  const cloudOptions = useMemo(() => toCloudOptions(clouds), [clouds]);
  const regionOptions = useMemo(
    () => toRegionOptions(clouds, values.cloud),
    [clouds, values.cloud],
  );

  // Extract cloud type from cloud tag (e.g., "cloud-aws" -> "ec2")
  const cloudType = useMemo(() => getCloudType(values.cloud), [values.cloud]);

  const authTypeOptions = useMemo(
    () => toAuthTypeOptions(cloudType),
    [cloudType],
  );

  // Auto-select first auth type when cloud changes
  useEffect(() => {
    if (cloudType && authTypeOptions.length > 0) {
      void setFieldValue(FieldName.AUTH_TYPE, authTypeOptions[0].value);
    } else if (!cloudType) {
      void setFieldValue(FieldName.AUTH_TYPE, "");
    }
  }, [cloudType, authTypeOptions, setFieldValue]);

  const authFields = useMemo(() => {
    if (!cloudType || !values.authType) {
      return [];
    }
    return AUTH_TYPE_SCHEMAS[cloudType]?.authTypes[values.authType] ?? [];
  }, [cloudType, values.authType]);

  return (
    <>
      <fieldset className="u-no-padding u-no-margin--bottom add-credential-panel__fieldset">
        <p className="p-text--small-caps">{Label.CREDENTIAL_DETAILS}</p>
        <FormikField
          label={Label.NAME}
          name={FieldName.NAME}
          required
          type="text"
        />
      </fieldset>
      <fieldset className="u-no-padding u-no-margin--bottom add-credential-panel__fieldset--bordered">
        <p className="p-text--small-caps">{Label.CLOUD_DETAILS}</p>
        <FormikField
          component={Select}
          label={Label.CLOUD}
          name={FieldName.CLOUD}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            void setFieldValue(FieldName.CLOUD, event.target.value);
            // Clear dependent fields when cloud changes
            void setFieldValue(FieldName.REGION, "");
            void setFieldValue(FieldName.AUTH_TYPE, "");
          }}
          options={cloudOptions}
          required
        />
        <FormikField
          component={Select}
          disabled={!values.cloud}
          label={Label.REGION}
          name={FieldName.REGION}
          options={regionOptions}
        />
      </fieldset>
      <fieldset className="u-no-padding u-no-margin--bottom add-credential-panel__fieldset--bordered">
        <p className="p-text--small-caps">{Label.AUTH_DETAILS}</p>
        <FormikField
          component={Select}
          disabled={!values.cloud}
          label={Label.AUTH_TYPE}
          name={FieldName.AUTH_TYPE}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const newAuthType = event.target.value;
            void setFieldValue(FieldName.AUTH_TYPE, newAuthType);
            // Clear all auth attrs when auth type changes
            const authAttrs = values[FieldName.AUTH_ATTRS];
            const clearedAttrs = Object.fromEntries(
              Object.keys(authAttrs).map((key) => [key, ""]),
            );
            void setFieldValue(FieldName.AUTH_ATTRS, clearedAttrs);
          }}
          options={authTypeOptions}
          required
        />
        {authFields.map((field) =>
          field.inputType === "textarea" ? (
            <FormikField
              key={field.name}
              component={Textarea}
              label={field.label}
              name={`${FieldName.AUTH_ATTRS}.${field.name}`}
              required={!field.optional}
            />
          ) : (
            <FormikField
              key={field.name}
              label={field.label}
              name={`${FieldName.AUTH_ATTRS}.${field.name}`}
              required={!field.optional}
              type={field.inputType}
            />
          ),
        )}
      </fieldset>
    </>
  );
};

export default Fields;
