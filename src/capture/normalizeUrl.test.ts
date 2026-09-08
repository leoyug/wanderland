import { describe, expect, it } from "vitest";
import { createFallbackTitle, formatUrlIdentity, normalizeUrl } from "./normalizeUrl";

describe("normalizeUrl", () => {
  it("removes fragments, tracking params and trailing slash", () => {
    expect(normalizeUrl("https://Example.com/work/?utm_source=test&id=4#intro"))
      .toBe("https://example.com/work?id=4");
  });
});

describe("URL identity", () => {
  it("keeps subpages visually distinguishable before metadata capture", () => {
    const url = "https://www.example.com/design/ui-components/?page=2";
    expect(formatUrlIdentity(url)).toBe("example.com/design/ui-components?page=2");
    expect(createFallbackTitle(url)).toBe("design › ui components");
  });

  it("uses the host as the fallback title for a homepage", () => {
    expect(createFallbackTitle("https://www.example.com/")).toBe("example.com");
  });
});
