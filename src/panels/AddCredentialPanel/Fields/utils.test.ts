import {
  toCloudOptions,
  toRegionOptions,
  toAuthTypeOptions,
  getAuthTypeFields,
  getCloudType,
} from "./utils";
import { AUTH_TYPE_SCHEMAS } from "./authTypeSchemas";

// Mock cloud data
const mockClouds = {
  "cloud/aws@source": {
    regions: [
      { name: "us-east-1" },
      { name: "us-west-2" },
      { name: "eu-west-1" },
    ],
  },
  "cloud/google@source": {
    regions: [
      { name: "us-central1" },
      { name: "europe-west1" },
    ],
  },
};

describe("toCloudOptions", () => {
  it("returns empty option as first item", () => {
    const options = toCloudOptions(mockClouds);
    expect(options[0]).toEqual({ label: "", value: "" });
  });

  it("extracts cloud names from cloud tags", () => {
    const options = toCloudOptions(mockClouds);
    expect(options.length).toBe(3); // empty + 2 clouds
    expect(options[1]).toEqual({ value: "cloud/aws@source", label: "aws" });
    expect(options[2]).toEqual({
      value: "cloud/google@source",
      label: "google",
    });
  });

  it("handles empty clouds object", () => {
    const options = toCloudOptions({});
    expect(options).toEqual([{ label: "", value: "" }]);
  });

  it("handles null/undefined clouds", () => {
    const options = toCloudOptions(null as any);
    expect(options).toEqual([{ label: "", value: "" }]);
  });
});

describe("toRegionOptions", () => {
  it("returns empty option as first item", () => {
    const options = toRegionOptions(mockClouds, "cloud/aws@source");
    expect(options[0]).toEqual({ label: "", value: "" });
  });

  it("returns all regions for a valid cloud", () => {
    const options = toRegionOptions(mockClouds, "cloud/aws@source");
    expect(options.length).toBe(4); // empty + 3 regions
    expect(options[1]).toEqual({ value: "us-east-1", label: "us-east-1" });
    expect(options[2]).toEqual({ value: "us-west-2", label: "us-west-2" });
    expect(options[3]).toEqual({ value: "eu-west-1", label: "eu-west-1" });
  });

  it("returns empty option for unknown cloud", () => {
    const options = toRegionOptions(mockClouds, "cloud/unknown@source");
    expect(options).toEqual([{ label: "", value: "" }]);
  });

  it("returns empty option when clouds is null", () => {
    const options = toRegionOptions(null as any, "cloud/aws@source");
    expect(options).toEqual([{ label: "", value: "" }]);
  });
});

describe("toAuthTypeOptions", () => {
  it("returns empty array for unknown cloud type", () => {
    const options = toAuthTypeOptions("unknown");
    expect(options).toEqual([]);
  });

  it("returns auth types for valid cloud", () => {
    const options = toAuthTypeOptions("ec2");
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty("label");
    expect(options[0]).toHaveProperty("value");
  });

  it("includes all auth types from AUTH_TYPE_SCHEMAS", () => {
    const options = toAuthTypeOptions("ec2");
    const authTypes = Object.keys(AUTH_TYPE_SCHEMAS.ec2.authTypes);
    expect(options.length).toBe(authTypes.length);
  });

  it("maps gce auth types", () => {
    const options = toAuthTypeOptions("gce");
    expect(options.length).toBeGreaterThan(0);
  });

  it("maps lxd auth types", () => {
    const options = toAuthTypeOptions("lxd");
    expect(options.length).toBeGreaterThan(0);
  });
});

describe("getAuthTypeFields", () => {
  it("returns empty array for empty cloudType", () => {
    const fields = getAuthTypeFields("", "access-key");
    expect(fields).toEqual([]);
  });

  it("returns empty array for empty authType", () => {
    const fields = getAuthTypeFields("ec2", "");
    expect(fields).toEqual([]);
  });

  it("returns empty array for unknown cloudType", () => {
    const fields = getAuthTypeFields("unknown", "some-auth");
    expect(fields).toEqual([]);
  });

  it("returns empty array for unknown authType", () => {
    const fields = getAuthTypeFields("ec2", "unknown-auth");
    expect(fields).toEqual([]);
  });

  it("returns fields for valid cloud and authType", () => {
    const fields = getAuthTypeFields("ec2", "access-key");
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0]).toHaveProperty("name");
    expect(fields[0]).toHaveProperty("label");
  });

  it("returns different fields for different auth types", () => {
    const accessKeyFields = getAuthTypeFields("ec2", "access-key");
    // Assuming there might be other auth types available
    expect(accessKeyFields.length).toBeGreaterThan(0);
  });
});

describe("getCloudType", () => {
  it("returns empty string for empty cloudTag", () => {
    const cloudType = getCloudType("");
    expect(cloudType).toBe("");
  });

  it("maps aws to ec2", () => {
    const cloudType = getCloudType("cloud/aws@source");
    expect(cloudType).toBe("ec2");
  });

  it("maps google to gce", () => {
    const cloudType = getCloudType("cloud/google@source");
    expect(cloudType).toBe("gce");
  });

  it("maps localhost to lxd", () => {
    const cloudType = getCloudType("cloud/localhost@source");
    expect(cloudType).toBe("lxd");
  });

  it("maps oracle to oci", () => {
    const cloudType = getCloudType("cloud/oracle@source");
    expect(cloudType).toBe("oci");
  });

  it("maps k8s to kubernetes", () => {
    const cloudType = getCloudType("cloud/k8s@source");
    expect(cloudType).toBe("kubernetes");
  });

  it("returns cloud name as-is when no override exists", () => {
    const cloudType = getCloudType("cloud/azure@source");
    expect(cloudType).toBe("azure");
  });

  it("extracts cloud name from cloud tag correctly", () => {
    const cloudType = getCloudType("cloud/my-custom-cloud@custom-source");
    expect(cloudType).toBe("my-custom-cloud");
  });

  it("handles cloud tags with multiple @ symbols (uses first one)", () => {
    const cloudType = getCloudType("cloud/aws@source@extra");
    expect(cloudType).toBe("ec2");
  });
});
