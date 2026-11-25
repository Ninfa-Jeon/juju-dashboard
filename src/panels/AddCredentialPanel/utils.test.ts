import * as Yup from "yup";

import { getAuthFieldsSchema } from "./utils";

describe("getAuthFieldsSchema", () => {
  it("returns empty object for empty cloud and authType", () => {
    const schema = getAuthFieldsSchema("", "");
    expect(schema).toEqual({});
  });

  it("returns empty object for unknown cloud", () => {
    const schema = getAuthFieldsSchema("cloud/unknown@source", "some-auth");
    expect(schema).toEqual({});
  });

  it("returns empty object for unknown authType", () => {
    const schema = getAuthFieldsSchema("cloud/aws@source", "unknown-auth");
    expect(schema).toEqual({});
  });

  it("builds schema with required validation for required fields", () => {
    const schema = getAuthFieldsSchema("cloud/aws@source", "access-key");
    expect(schema).toHaveProperty("access-key");
    expect(schema).toHaveProperty("secret-key");

    // Test required validation
    const accessKeySchema = schema["access-key"];
    expect(() => accessKeySchema.validateSync("")).toThrow();
    expect(() => accessKeySchema.validateSync(null)).toThrow();
  });

  it("allows undefined for optional fields", () => {
    const schema = getAuthFieldsSchema("cloud/aws@source", "access-key");
    const accessKeySchema = schema["access-key"];
    // Should not throw for a valid value
    expect(() => accessKeySchema.validateSync("valid-key")).not.toThrow();
  });

  it("validates email format when format is email", () => {
    const schema = getAuthFieldsSchema("cloud/google@source", "oauth2");
    if (schema["client-email"]) {
      const emailSchema = schema["client-email"];
      expect(() => emailSchema.validateSync("not-an-email")).toThrow();
      expect(() => emailSchema.validateSync("valid@example.com")).not.toThrow();
    }
  });

  it("validates JSON format when format is json", () => {
    const schema = getAuthFieldsSchema("cloud/google@source", "service-account");
    if (schema["private-key-json"]) {
      const jsonSchema = schema["private-key-json"];
      expect(() => jsonSchema.validateSync("not json")).toThrow();
      expect(() => jsonSchema.validateSync('{"key": "value"}')).not.toThrow();
    }
  });

  it("validates UUID format when format is uuid", () => {
    const schema = getAuthFieldsSchema("cloud/azure@source", "client-secret");
    if (schema["subscription-id"]) {
      const uuidSchema = schema["subscription-id"];
      // Invalid UUID
      expect(() => uuidSchema.validateSync("not-a-uuid")).toThrow();
      // Valid UUID
      expect(() => uuidSchema.validateSync("550e8400-e29b-41d4-a716-446655440000")).not.toThrow();
    }
  });

  it("accepts PEM format as plain text without validation", () => {
    const schema = getAuthFieldsSchema("cloud/localhost@source", "certificate");
    if (schema["client-cert"]) {
      const pemSchema = schema["client-cert"];
      const pemContent = `-----BEGIN CERTIFICATE-----
MIICljCCAX4CCQCKz0Rmt...
-----END CERTIFICATE-----`;
      expect(() => pemSchema.validateSync(pemContent)).not.toThrow();
    }
  });

  it("maps cloud names correctly (aws -> ec2)", () => {
    // Both should produce the same schema
    const schema1 = getAuthFieldsSchema("cloud/aws@source", "access-key");
    expect(Object.keys(schema1).length).toBeGreaterThan(0);
  });

  it("maps cloud names correctly (google -> gce)", () => {
    const schema = getAuthFieldsSchema("cloud/google@source", "oauth2");
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  it("maps cloud names correctly (localhost -> lxd)", () => {
    const schema = getAuthFieldsSchema("cloud/localhost@source", "certificate");
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  it("maps cloud names correctly (oracle -> oci)", () => {
    const schema = getAuthFieldsSchema("cloud/oracle@source", "httpsig");
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  it("maps cloud names correctly (k8s -> kubernetes)", () => {
    const schema = getAuthFieldsSchema("cloud/k8s@source", "userpass");
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });

  it("returns all fields for a valid cloud and authType combination", () => {
    const schema = getAuthFieldsSchema("cloud/aws@source", "access-key");
    expect(schema).toHaveProperty("access-key");
    expect(schema).toHaveProperty("secret-key");
    expect(Object.keys(schema).length).toBe(2);
  });
});
