export type ThemePreference = "system" | "light" | "dark";

export const THEME_PREFERENCE_KEY = "wanderland.theme.preference";

let preference: ThemePreference = "system";
const listeners = new Set<() => void>();

export function normalizeThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(preferred: ThemePreference, systemIsDark: boolean): "light" | "dark" {
  return preferred === "system" ? (systemIsDark ? "dark" : "light") : preferred;
}

function hasExtensionStorage() {
  return typeof browser !== "undefined" && Boolean(browser.runtime?.id && browser.storage?.local);
}

export async function readThemePreference(): Promise<ThemePreference> {
  try {
    if (hasExtensionStorage()) {
      const stored = await browser.storage.local.get(THEME_PREFERENCE_KEY);
      return normalizeThemePreference(stored[THEME_PREFERENCE_KEY]);
    }
  } catch {
    // Use the preview fallback if extension storage is temporarily unavailable.
  }
  try { return normalizeThemePreference(window.localStorage.getItem(THEME_PREFERENCE_KEY)); }
  catch { return "system"; }
}

function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function updatePreference(next: ThemePreference) {
  if (preference !== next) {
    preference = next;
    listeners.forEach((listener) => listener());
  }
  applyTheme();
}

export async function initializeTheme() {
  updatePreference(await readThemePreference());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
  if (hasExtensionStorage() && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[THEME_PREFERENCE_KEY]) {
        updatePreference(normalizeThemePreference(changes[THEME_PREFERENCE_KEY].newValue));
      }
    });
  }
}

export function getThemePreferenceSnapshot() { return preference; }

export function subscribeThemePreference(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function setThemePreference(next: ThemePreference) {
  updatePreference(next);
  try {
    if (hasExtensionStorage()) {
      await browser.storage.local.set({ [THEME_PREFERENCE_KEY]: next });
      return;
    }
  } catch {
    // Use the preview fallback if extension storage is temporarily unavailable.
  }
  try { window.localStorage.setItem(THEME_PREFERENCE_KEY, next); }
  catch { /* The selected theme still remains usable for this session. */ }
}
