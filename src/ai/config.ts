import type { AiSettings, AiSettingsView, ApiKeyStorage } from "./types";
import { inferProvider } from "./presets";

const SETTINGS_KEY = "wanderland.ai.settings";
const LOCAL_KEY = "wanderland.ai.apiKey";
const SESSION_KEY = "wanderland.ai.sessionApiKey";

export const defaultAiSettings: AiSettings = {
  enabled: false,
  provider: "openai",
  endpoint: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  apiKeyStorage: "session",
};

function cleanSettings(value: Partial<AiSettings> | undefined): AiSettings {
  const endpoint = value?.endpoint?.trim().replace(/\/$/, "") || defaultAiSettings.endpoint;
  const model = value?.model?.trim() || defaultAiSettings.model;
  const apiKeyStorage: ApiKeyStorage = value?.apiKeyStorage === "local" ? "local" : "session";
  const provider = value?.provider === "openai" || value?.provider === "deepseek" || value?.provider === "custom"
    ? value.provider
    : inferProvider(endpoint);
  return { enabled: value?.enabled === true, provider, endpoint, model, apiKeyStorage };
}

export async function getAiSettings(): Promise<AiSettingsView> {
  const stored = await browser.storage.local.get([SETTINGS_KEY, LOCAL_KEY]);
  const settings = cleanSettings(stored[SETTINGS_KEY] as Partial<AiSettings> | undefined);
  const session = await browser.storage.session.get(SESSION_KEY);
  const apiKey = settings.apiKeyStorage === "local" ? stored[LOCAL_KEY] : session[SESSION_KEY];
  return { ...settings, hasApiKey: typeof apiKey === "string" && apiKey.length > 0 };
}

async function getStoredCredential() {
  const stored = await browser.storage.local.get([SETTINGS_KEY, LOCAL_KEY]);
  const settings = cleanSettings(stored[SETTINGS_KEY] as Partial<AiSettings> | undefined);
  const area = settings.apiKeyStorage === "local" ? browser.storage.local : browser.storage.session;
  const key = settings.apiKeyStorage === "local" ? LOCAL_KEY : SESSION_KEY;
  const value = await area.get(key);
  return { provider: settings.provider, apiKey: typeof value[key] === "string" ? value[key] as string : "" };
}

export async function getAiCredentials(): Promise<{ settings: AiSettings; apiKey: string } | null> {
  const view = await getAiSettings();
  if (!view.enabled || !view.hasApiKey) return null;
  assertSecureAiEndpoint(view.endpoint);
  const area = view.apiKeyStorage === "local" ? browser.storage.local : browser.storage.session;
  const key = view.apiKeyStorage === "local" ? LOCAL_KEY : SESSION_KEY;
  const stored = await area.get(key);
  return { settings: view, apiKey: String(stored[key] ?? "") };
}

export async function saveAiSettings(input: AiSettings & { apiKey?: string }): Promise<AiSettingsView> {
  assertSecureAiEndpoint(input.endpoint);
  const previous = await getStoredCredential();
  const settings = cleanSettings(input);
  const apiKey = input.apiKey?.trim() || (previous.provider === settings.provider ? previous.apiKey : "");
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
  if (settings.apiKeyStorage === "local") {
    if (apiKey) await browser.storage.local.set({ [LOCAL_KEY]: apiKey });
    else await browser.storage.local.remove(LOCAL_KEY);
    await browser.storage.session.remove(SESSION_KEY);
  } else {
    if (apiKey) await browser.storage.session.set({ [SESSION_KEY]: apiKey });
    else await browser.storage.session.remove(SESSION_KEY);
    await browser.storage.local.remove(LOCAL_KEY);
  }
  return getAiSettings();
}

export async function hardenAiCredentialStorage() {
  await Promise.all([
    browser.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    browser.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  ]);
}

export function assertSecureAiEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("Endpoint 必须使用 https://");
  if (url.username || url.password) throw new Error("Endpoint 不能包含用户名、密码或 API Key");
  return url;
}

export function endpointPermissionPattern(endpoint: string) {
  const url = assertSecureAiEndpoint(endpoint);
  return `${url.protocol}//${url.hostname}/*`;
}
