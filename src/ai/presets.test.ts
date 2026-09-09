import { describe, expect, it } from "vitest";
import { aiProviderPresets, inferProvider } from "./presets";

describe("AI provider presets", () => {
  it("uses the current official DeepSeek OpenAI-compatible endpoint and model", () => {
    expect(aiProviderPresets.deepseek).toMatchObject({
      endpoint: "https://api.deepseek.com",
      model: "deepseek-v4-flash",
    });
    expect(inferProvider("https://api.deepseek.com/v1")).toBe("deepseek");
  });
});
