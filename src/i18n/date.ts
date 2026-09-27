import { getAppLanguageSnapshot } from "./language";
import { t } from "./ui";

export function formatUiDate(timestamp: number, includeTime = false): string {
  const elapsed = Date.now() - timestamp;
  if (!includeTime && elapsed >= 0 && elapsed < 60_000) return t("刚刚");
  const locale = getAppLanguageSnapshot();
  return new Intl.DateTimeFormat(locale, includeTime
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "short", day: "numeric" }).format(timestamp);
}
