import { describe, expect, it } from "vitest";
import { normalizeThemePreference, resolveTheme } from "./themePreferences";

describe("theme preferences", () => {
  it("defaults invalid or missing preferences to system", () => {
    expect(normalizeThemePreference(undefined)).toBe("system");
    expect(normalizeThemePreference("sepia")).toBe("system");
    expect(normalizeThemePreference("dark")).toBe("dark");
  });

  it("follows the OS only when system is selected", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
