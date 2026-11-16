import { describe, expect, it } from "vitest";
import { formatBuildVersion } from "./version.js";

describe("formatBuildVersion", () => {
  it("formats to minutes in UTC", () => {
    expect(formatBuildVersion(new Date("2026-11-16T14:32:59.999Z"))).toBe("2026-11-16T14:32Z");
  });

  it("appends short sha", () => {
    expect(formatBuildVersion(new Date("2026-11-16T14:32:00Z"), "abc1234")).toBe(
      "2026-11-16T14:32Z (abc1234)",
    );
  });

  it("empty sha is ignored", () => {
    expect(formatBuildVersion(new Date("2026-11-16T14:32:00Z"), "")).toBe("2026-11-16T14:32Z");
    expect(formatBuildVersion(new Date("2026-11-16T14:32:00Z"), "  ")).toBe("2026-11-16T14:32Z");
  });
});
