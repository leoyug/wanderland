export const supportedAppLanguages = ["zh-CN", "en-US"] as const;
export type AppLanguage = (typeof supportedAppLanguages)[number];

export const defaultAppLanguage: AppLanguage = "zh-CN";
const APP_LANGUAGE_KEY = "wanderland.interface.language";

export async function getAppLanguage(): Promise<AppLanguage> {
  const stored = await browser.storage.local.get(APP_LANGUAGE_KEY);
  const value = stored[APP_LANGUAGE_KEY];
  return supportedAppLanguages.includes(value as AppLanguage) ? value as AppLanguage : defaultAppLanguage;
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await browser.storage.local.set({ [APP_LANGUAGE_KEY]: language });
}
