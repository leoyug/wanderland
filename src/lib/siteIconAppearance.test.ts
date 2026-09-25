import { describe, expect, it } from "vitest";
import { detectSiteIconBackground, detectSvgSiteIconBackground } from "./siteIconAppearance";

function pixels(foreground: [number, number, number, number], background: [number, number, number, number]) {
  return new Uint8ClampedArray(Array.from({ length: 100 }, (_, index) => index < 25 ? foreground : background).flat());
}

describe("detectSiteIconBackground", () => {
  it("adds a dark backing to a light transparent logo", () => {
    expect(detectSiteIconBackground(pixels([255, 255, 255, 255], [0, 0, 0, 0]))).toBe("dark");
  });

  it("leaves dark transparent marks and opaque photos untouched", () => {
    expect(detectSiteIconBackground(pixels([30, 30, 30, 255], [0, 0, 0, 0]))).toBeUndefined();
    expect(detectSiteIconBackground(pixels([245, 245, 245, 255], [245, 245, 245, 255]))).toBeUndefined();
  });

  it("does not classify empty or largely invisible images", () => {
    expect(detectSiteIconBackground(new Uint8ClampedArray())).toBeUndefined();
    expect(detectSiteIconBackground(pixels([255, 255, 255, 0], [0, 0, 0, 0]))).toBeUndefined();
  });
});

describe("detectSvgSiteIconBackground", () => {
  it("recognizes an unambiguous white SVG mark", () => {
    expect(detectSvgSiteIconBackground('<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M0 0h16v16z"/></svg>')).toBe("dark");
    expect(detectSvgSiteIconBackground('<svg><style>.mark{fill: rgb(248, 248, 248)}</style><path class="mark"/></svg>')).toBe("dark");
  });

  it("leaves dark, mixed, or opaque-background SVGs unchanged", () => {
    expect(detectSvgSiteIconBackground('<svg><path fill="#111"/></svg>')).toBeUndefined();
    expect(detectSvgSiteIconBackground('<svg><path fill="white" stroke="black"/></svg>')).toBeUndefined();
    expect(detectSvgSiteIconBackground('<svg><rect fill="white"/><path fill="white"/></svg>')).toBeUndefined();
    expect(detectSvgSiteIconBackground('<svg><path fill="currentColor"/></svg>')).toBeUndefined();
    expect(detectSvgSiteIconBackground('<svg><path fill="white"/><path/></svg>')).toBeUndefined();
    expect(detectSvgSiteIconBackground('<svg><path stroke="white"/></svg>')).toBeUndefined();
  });
});
