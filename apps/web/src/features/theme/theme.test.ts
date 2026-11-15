import { afterEach, describe, expect, it } from "vitest";
import {
  getThemePreference,
  parsePreference,
  readPreference,
  resolveTheme,
  setThemePreference,
  THEME_STORAGE_KEY,
} from "./theme.js";

describe("theme", () => {
  afterEach(() => setThemePreference("system"));

  it("defaults to system for missing or unknown values", () => {
    expect(parsePreference(null)).toBe("system");
    expect(parsePreference("purple")).toBe("system");
    expect(parsePreference("dark")).toBe("dark");
  });

  it("resolves system from the OS preference, explicit choice wins", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("persists the choice and applies data-theme", () => {
    setThemePreference("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readPreference()).toBe("dark");
    expect(getThemePreference()).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    setThemePreference("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("system removes the stored value", () => {
    setThemePreference("dark");
    setThemePreference("system");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(readPreference()).toBe("system");
  });
});
