import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./normalizeUrl";

describe("normalizeUrl", () => {
  it("removes fragments, tracking params and trailing slash", () => {
    expect(normalizeUrl("https://Example.com/work/?utm_source=test&id=4#intro"))
      .toBe("https://example.com/work?id=4");
  });
});
