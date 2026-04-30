import getModelURL from "./getModelURL";

describe("getModelURL", () => {
  it("should replace /api with the model path", () => {
    const result = getModelURL("wss://controller.example.com/api", "abc-123");
    expect(result).toBe("wss://controller.example.com/model/abc-123/api");
  });

  it("should work with a different protocol", () => {
    const result = getModelURL("ws://controller.example.com/api", "abc-123");
    expect(result).toBe("ws://controller.example.com/model/abc-123/api");
  });

  it("should work with a URL that has path prefix and a port", () => {
    const result = getModelURL(
      "wss://controller.example.com/juju:17070/api",
      "abc-123",
    );
    expect(result).toBe(
      "wss://controller.example.com/juju:17070/model/abc-123/api",
    );
  });
});
