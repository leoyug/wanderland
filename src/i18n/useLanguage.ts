import { useSyncExternalStore } from "react";
import { getAppLanguageSnapshot, getLanguagePreferenceSnapshot, subscribeLanguage } from "./language";

export function useAppLanguage() {
  return useSyncExternalStore(subscribeLanguage, getAppLanguageSnapshot);
}

export function useLanguagePreference() {
  return useSyncExternalStore(subscribeLanguage, getLanguagePreferenceSnapshot);
}
