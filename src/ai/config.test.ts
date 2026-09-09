import { afterEach, describe, expect, it, vi } from "vitest";
import { getAiSettings, hardenAiCredentialStorage, saveAiSettings } from "./config";

function storageArea() {
  const values: Record<string, unknown> = {};
  const setAccessLevel = vi.fn().mockResolvedValue(undefined);
  return {
    values,
    setAccessLevel,
    async get(keys: string | string[]) {
      const selected = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(selected.filter((key) => key in values).map((key) => [key, values[key]]));
    },
    async set(next: Record<string, unknown>) { Object.assign(values, next); },
    async remove(keys: string | string[]) { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key]; },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("AI settings storage", () => {
  it("keeps session keys out of local storage and migrates them without exposing the value", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await saveAiSettings({ enabled: true, provider: "custom", endpoint: "https://api.example.com/v1/", model: "model", apiKeyStorage: "session", apiKey: "secret" });
    expect(Object.values(local.values)).not.toContain("secret");
    expect(Object.values(session.values)).toContain("secret");
    expect(await getAiSettings()).toEqual({ enabled: true, provider: "custom", endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "session", hasApiKey: true });

    await saveAiSettings({ enabled: false, provider: "custom", endpoint: "https://api.example.com/v1", model: "model", apiKeyStorage: "local" });
    expect(Object.values(session.values)).not.toContain("secret");
    expect(Object.values(local.values)).toContain("secret");
    expect(await getAiSettings()).toMatchObject({ enabled: false, apiKeyStorage: "local", hasApiKey: true });
  });

  it("recognizes existing DeepSeek endpoints when migrating settings", async () => {
    const local = storageArea();
    const session = storageArea();
    local.values["wanderland.ai.settings"] = { enabled: true, endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKeyStorage: "session" };
    vi.stubGlobal("browser", { storage: { local, session } });

    expect(await getAiSettings()).toMatchObject({ provider: "deepseek", endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash" });
  });

  it("does not reuse an API key after switching providers", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });
    await saveAiSettings({ enabled: true, provider: "openai", endpoint: "https://api.openai.com/v1", model: "gpt-4.1-mini", apiKeyStorage: "session", apiKey: "openai-secret" });

    const view = await saveAiSettings({ enabled: true, provider: "deepseek", endpoint: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKeyStorage: "session" });

    expect(view.hasApiKey).toBe(false);
    expect(Object.values(session.values)).not.toContain("openai-secret");
  });

  it("rejects insecure or credential-bearing endpoints before storing a key", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await expect(saveAiSettings({ enabled: true, provider: "custom", endpoint: "http://api.example.com", model: "model", apiKeyStorage: "session", apiKey: "secret" })).rejects.toThrow("https://");
    await expect(saveAiSettings({ enabled: true, provider: "custom", endpoint: "https://secret@api.example.com", model: "model", apiKeyStorage: "session", apiKey: "secret" })).rejects.toThrow("不能包含");
    expect(Object.values(local.values)).not.toContain("secret");
    expect(Object.values(session.values)).not.toContain("secret");
  });

  it("restricts both credential storage areas to trusted extension contexts", async () => {
    const local = storageArea();
    const session = storageArea();
    vi.stubGlobal("browser", { storage: { local, session } });

    await hardenAiCredentialStorage();

    expect(local.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
    expect(session.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" });
  });
});
