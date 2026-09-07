import { describe, expect, it } from "vitest";
import { resolveDescription } from "./inspiration";

describe("resolveDescription", () => {
  it("never lets page or AI processing overwrite a user description", () => {
    const current = { description: "用户填写的描述", descriptionSource: "user" as const };

    expect(resolveDescription(current, { description: "网页描述", source: "page" })).toBe(current);
    expect(resolveDescription(current, { description: "AI 总结", source: "ai" })).toBe(current);
  });

  it("prefers a page description over an AI summary", () => {
    expect(resolveDescription(
      { description: "AI 总结", descriptionSource: "ai" },
      { description: "网页描述", source: "page" },
    )).toEqual({ description: "网页描述", descriptionSource: "page" });
  });

  it("uses an AI summary only when no description exists", () => {
    expect(resolveDescription(
      { description: "" },
      { description: "  AI 总结  ", source: "ai" },
    )).toEqual({ description: "AI 总结", descriptionSource: "ai" });
  });

  it("allows a description to be updated by the same source", () => {
    expect(resolveDescription(
      { description: "旧的用户描述", descriptionSource: "user" },
      { description: "新的用户描述", source: "user" },
    )).toEqual({ description: "新的用户描述", descriptionSource: "user" });
  });
});
