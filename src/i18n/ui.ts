import { getAppLanguageSnapshot } from "./language";
import { enUS } from "./messages.en";

/** Source strings are the existing Simplified Chinese UI copy. Saved content never passes through this function. */
export function t(source: string): string {
  if (getAppLanguageSnapshot() === "zh-CN") return source;
  const trimmed = source.trim();
  const translated = enUS[trimmed];
  if (!translated) return source;
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

export function tf(source: string, values: Record<string, string | number>): string {
  return t(source).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""));
}
