import { describe, expect, it } from "vitest";
import { normalizeSidebarWidth } from "./sidebarPreferences";

describe("normalizeSidebarWidth", () => {
  it("limits expanded sidebars to the compact maximum", () => {
    expect(normalizeSidebarWidth(360)).toBe(320);
  });

  it("snaps a pointer drag back to the default width when released nearby", () => {
    expect(normalizeSidebarWidth(201, true)).toBe(220);
    expect(normalizeSidebarWidth(239, true)).toBe(220);
    expect(normalizeSidebarWidth(199, true)).toBe(199);
    expect(normalizeSidebarWidth(241, true)).toBe(241);
  });

  it("keeps the collapsed threshold intact", () => {
    expect(normalizeSidebarWidth(160)).toBe(72);
  });
});
