import { describe, expect, it } from "vitest";
import { getSiteIconCandidates } from "./siteIcon";

describe("getSiteIconCandidates", () => {
  it("prefers the captured icon and falls back to the site root", () => {
    expect(getSiteIconCandidates("https://example.com/assets/icon.svg", "https://example.com/posts/1")).toEqual([
      "https://example.com/assets/icon.svg",
      "https://example.com/favicon.ico",
    ]);
  });

  it("provides a root favicon for manually added items", () => {
    expect(getSiteIconCandidates(undefined, "https://example.com/posts/1")).toEqual(["https://example.com/favicon.ico"]);
  });

  it("deduplicates a captured root favicon and ignores invalid URLs", () => {
    expect(getSiteIconCandidates("https://example.com/favicon.ico", "https://example.com/posts/1")).toEqual(["https://example.com/favicon.ico"]);
    expect(getSiteIconCandidates(undefined, "not-a-url")).toEqual([]);
  });
});
