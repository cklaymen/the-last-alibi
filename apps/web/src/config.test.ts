import { describe, expect, it } from "vitest";
import { resolveApiConfig } from "./config.js";

describe("resolveApiConfig", () => {
  it("absolute URL: HTTP and socket go to it, default socket path", () => {
    expect(resolveApiConfig("http://localhost:3000/", "http://web")).toEqual({
      apiUrl: "http://localhost:3000",
      socketUrl: "http://localhost:3000",
      socketPath: undefined,
    });
  });

  it("relative URL: HTTP under the prefix, socket on the page origin at /socket.io", () => {
    expect(resolveApiConfig("/api", "http://web:8080")).toEqual({
      apiUrl: "/api",
      socketUrl: "http://web:8080",
      socketPath: "/socket.io",
    });
  });

  it("defaults to localhost:3000", () => {
    expect(resolveApiConfig(undefined, "http://web").apiUrl).toBe("http://localhost:3000");
  });
});
