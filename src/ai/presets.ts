import type { AiProviderId } from "./types";

export interface AiProviderPreset {
  id: Exclude<AiProviderId, "custom">;
  label: string;
  endpoint: string;
  model: string;
}

export const aiProviderPresets: Record<AiProviderPreset["id"], AiProviderPreset> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  },
};

export function inferProvider(endpoint: string): AiProviderId {
  try {
    const hostname = new URL(endpoint).hostname;
    if (hostname === "api.deepseek.com") return "deepseek";
    if (hostname === "api.openai.com") return "openai";
  } catch {
    // Endpoint validation happens when the user saves settings.
  }
  return "custom";
}
