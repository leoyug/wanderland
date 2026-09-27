export const supportedAppLanguages = ["zh-CN", "en-US"] as const;
export type AppLanguage = (typeof supportedAppLanguages)[number];
export type LanguagePreference = "system" | AppLanguage;

export const defaultAppLanguage: AppLanguage = "zh-CN";
export const APP_LANGUAGE_KEY = "wanderland.interface.language";

let preference: LanguagePreference = defaultAppLanguage;
let currentLanguage: AppLanguage = defaultAppLanguage;
let initialized = false;
let updatesDocumentLanguage = true;
const listeners = new Set<() => void>();

export function normalizeLanguagePreference(value: unknown): LanguagePreference {
  return value === "system" || value === "en-US" ? value : defaultAppLanguage;
}

export function resolveAppLanguage(selected: LanguagePreference, systemLanguage: string): AppLanguage {
  if (selected !== "system") return selected;
  return systemLanguage.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

function systemLanguage() {
  return globalThis.navigator?.languages?.[0] ?? globalThis.navigator?.language ?? defaultAppLanguage;
}

function hasExtensionStorage() {
  return typeof browser !== "undefined" && Boolean(browser.storage?.local);
}

export async function readLanguagePreference(): Promise<LanguagePreference> {
  try {
    if (hasExtensionStorage()) {
      const stored = await browser.storage.local.get(APP_LANGUAGE_KEY);
      return normalizeLanguagePreference(stored[APP_LANGUAGE_KEY]);
    }
  } catch {
    // The dashboard preview can still use its local preference.
  }
  try { return normalizeLanguagePreference(globalThis.localStorage?.getItem(APP_LANGUAGE_KEY)); }
  catch { return defaultAppLanguage; }
}

function updateLanguage(next: LanguagePreference) {
  const resolved = resolveAppLanguage(next, systemLanguage());
  const changed = preference !== next || currentLanguage !== resolved;
  preference = next;
  currentLanguage = resolved;
  if (updatesDocumentLanguage && typeof document !== "undefined") document.documentElement.lang = resolved;
  if (changed) listeners.forEach((listener) => listener());
}

/** Apply a preference delivered by the background to a content script without touching page storage. */
export function applyLanguagePreference(next: LanguagePreference, updateDocumentLanguage = false) {
  updatesDocumentLanguage = updateDocumentLanguage;
  updateLanguage(next);
}

export async function initializeLanguage(options: { updateDocumentLanguage?: boolean } = {}) {
  updatesDocumentLanguage = options.updateDocumentLanguage ?? true;
  updateLanguage(await readLanguagePreference());
  if (initialized) return;
  initialized = true;
  if (typeof window !== "undefined") window.addEventListener("languagechange", () => updateLanguage(preference));
  if (hasExtensionStorage() && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[APP_LANGUAGE_KEY]) {
        updateLanguage(normalizeLanguagePreference(changes[APP_LANGUAGE_KEY].newValue));
      }
    });
  }
}

export function getLanguagePreferenceSnapshot() { return preference; }
export function getAppLanguageSnapshot() { return currentLanguage; }
export function subscribeLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function setLanguagePreference(next: LanguagePreference) {
  updateLanguage(next);
  try {
    if (hasExtensionStorage()) {
      await browser.storage.local.set({ [APP_LANGUAGE_KEY]: next });
      return;
    }
  } catch {
    // Persist to the preview fallback when extension storage is unavailable.
  }
  try { globalThis.localStorage?.setItem(APP_LANGUAGE_KEY, next); }
  catch { /* The current page still keeps the selected language. */ }
}

/** Used by background jobs so the language is read when generation starts. */
export async function getAppLanguage(): Promise<AppLanguage> {
  return resolveAppLanguage(await readLanguagePreference(), systemLanguage());
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await setLanguagePreference(language);
}
