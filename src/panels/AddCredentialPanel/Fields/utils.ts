import type { CloudState } from "store/juju/types";
import { extractCloudName } from "store/juju/utils/models";
import type { SelectOption } from "store/middleware/source/types";

import { AUTH_TYPE_SCHEMAS } from "./authTypeSchemas";
import type { AuthTypeField } from "./types";

const EMPTY_OPTION: SelectOption = {
  label: "",
  value: "",
};

export const toCloudOptions = (
  clouds: CloudState["clouds"],
): SelectOption[] => [
  EMPTY_OPTION,
  ...Object.keys(clouds ?? {}).map((cloudTag) => ({
    value: cloudTag,
    label: extractCloudName(cloudTag),
  })),
];

export const toRegionOptions = (
  clouds: CloudState["clouds"],
  cloudTag: string,
): SelectOption[] => [
  EMPTY_OPTION,
  ...(clouds?.[cloudTag]?.regions ?? []).map(({ name }) => ({
    value: name,
    label: name,
  })),
];

export const toAuthTypeOptions = (cloudType: string): SelectOption[] => {
  const schema = AUTH_TYPE_SCHEMAS[cloudType];
  if (!schema) {
    return [];
  }
  return Object.keys(schema.authTypes).map((authType) => ({
    label: authType,
    value: authType,
  }));
};

export const getAuthTypeFields = (
  cloudType: string,
  authType: string,
): AuthTypeField[] => {
  if (!cloudType || !authType) {
    return [];
  }
  return AUTH_TYPE_SCHEMAS[cloudType]?.authTypes[authType] ?? [];
};

// Map cloud names to schema keys. Only list clouds that don't directly transfer.
const CLOUD_TYPE_OVERRIDES: Record<string, string> = {
  aws: "ec2",
  google: "gce",
  localhost: "lxd",
  oracle: "oci",
  k8s: "kubernetes",
};

export const getCloudType = (cloudTag: string): string => {
  if (!cloudTag) {
    return "";
  }
  const cloudName = extractCloudName(cloudTag);
  // Check if there's an override for this cloud name
  if (cloudName in CLOUD_TYPE_OVERRIDES) {
    return CLOUD_TYPE_OVERRIDES[cloudName];
  }
  // Otherwise, use the cloud name as-is (most clouds map directly)
  return cloudName;
};
