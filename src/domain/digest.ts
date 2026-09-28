import type { CoverData, LibraryItem, SavedItemKind } from "./inspiration";

export type DigestKind = "daily" | "weekly";
export interface DigestEntry {
  id: string;
  kind: SavedItemKind;
  title: string;
  url: string;
  siteHost: string;
  description: string;
  tags: string[];
  cover: CoverData;
  siteIcon?: string;
  siteIconAutoBackground?: "dark";
  siteIconBackgroundOverride?: "light" | "dark";
  createdAt: number;
}
export interface ContentDigest {
  id: string;
  kind: DigestKind;
  periodStart: number;
  periodEnd: number;
  title: string;
  introduction: string;
  author: "Leo";
  entries: DigestEntry[];
  retrospective: DigestEntry[];
  createdAt: number;
  readAt?: number;
}

export function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
export function digestPeriod(kind: DigestKind, timestamp: number) {
  const start = new Date(timestamp);
  start.setHours(0, 0, 0, 0);
  if (kind === "weekly") start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  const end = new Date(start);
  end.setDate(end.getDate() + (kind === "weekly" ? 7 : 1));
  return { start: start.getTime(), end: end.getTime() };
}
export function digestId(kind: DigestKind, start: number) { return `${kind}-${localDateKey(start)}`; }
export function digestDateLabel(digest: Pick<ContentDigest, "periodEnd">) { return localDateKey(digest.periodEnd - 1); }
export function digestRangeLabel(digest: Pick<ContentDigest, "kind" | "periodStart" | "periodEnd">) {
  if (digest.kind === "daily") return localDateKey(digest.periodStart);
  const first = localDateKey(digest.periodStart);
  const last = localDateKey(digest.periodEnd - 1);
  return first.slice(0, 5) === last.slice(0, 5) ? `${first}–${last.slice(5)}` : `${first}–${last}`;
}
export function safeDigestUrl(url: string) {
  try { const parsed = new URL(url); return /^https?:$/.test(parsed.protocol) ? parsed.href : undefined; }
  catch { return undefined; }
}
function summarize(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  const excerpt = clean.slice(0, 180);
  const boundary = Math.max(excerpt.lastIndexOf("。"), excerpt.lastIndexOf("！"), excerpt.lastIndexOf("？"));
  return boundary >= 60 ? excerpt.slice(0, boundary + 1) : `${excerpt.trimEnd()}…`;
}
function snapshot(item: LibraryItem): DigestEntry {
  return {
    id: item.id, kind: item.kind, title: item.title, url: item.url, siteHost: item.siteHost,
    description: summarize(item.description), tags: [...item.tags], cover: { ...item.cover },
    siteIcon: item.siteIcon, siteIconAutoBackground: item.siteIconAutoBackground,
    siteIconBackgroundOverride: item.siteIconBackgroundOverride, createdAt: item.createdAt,
  };
}

export function buildDigest(kind: DigestKind, periodStart: number, items: LibraryItem[], now = Date.now()): ContentDigest {
  const period = digestPeriod(kind, periodStart);
  const active = items.filter((item) => !item.archivedAt && safeDigestUrl(item.url));
  const current = active.filter((item) => item.createdAt >= period.start && item.createdAt < period.end)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const currentUrls = new Set(current.map((item) => item.canonicalUrl));
  const old = kind === "weekly" ? active.filter((item) => item.createdAt < period.start && !currentUrls.has(item.canonicalUrl))
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.createdAt - a.createdAt || a.id.localeCompare(b.id)) : [];
  const retrospective: LibraryItem[] = [];
  const seen = new Set<string>();
  for (const item of old) {
    if (seen.has(item.canonicalUrl)) continue;
    retrospective.push(item); seen.add(item.canonicalUrl);
    if (retrospective.length === 3) break;
  }
  const topics = new Map<string, number>();
  for (const item of current) for (const tag of new Set(item.tags)) topics.set(tag, (topics.get(tag) ?? 0) + 1);
  const themes = [...topics].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([name]) => name);
  const title = themes.length ? `${themes.join("与")}的新发现` : kind === "daily" ? "今天收藏的灵感" : "这一周，值得留住的灵感";
  const subject = kind === "daily" ? "今天" : "这一周";
  const introduction = current.length
    ? `${subject}新增了 ${current.length} 条收藏${themes.length ? `，内容围绕${themes.join("、")}展开` : ""}。按网站、文章与关注源整理，方便继续阅读与探索。${retrospective.length ? `最后还有 ${retrospective.length} 条过往收藏，值得再看一遍。` : ""}`
    : `${subject}还没有新增收藏。${retrospective.length ? `这次回顾 ${retrospective.length} 条过往收藏，从已有灵感中重新出发。` : "遇到喜欢的内容时，先把链接留在库里。"}`;
  return { id: digestId(kind, period.start), kind, periodStart: period.start, periodEnd: period.end, title, introduction,
    author: "Leo", entries: current.map(snapshot), retrospective: retrospective.map(snapshot), createdAt: now };
}
