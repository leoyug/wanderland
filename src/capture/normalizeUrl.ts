export function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || key === "ref") url.searchParams.delete(key);
  }
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
}

function decodeUrlPart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function formatUrlIdentity(input: string): string {
  const url = new URL(input);
  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname === "/" ? "" : decodeUrlPart(url.pathname).replace(/\/$/, "");
  return `${host}${path}${url.search}`;
}

export function createFallbackTitle(input: string): string {
  const url = new URL(input);
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => decodeUrlPart(segment).replace(/[-_]+/g, " ").trim())
    .filter(Boolean);
  if (segments.length === 0) return url.hostname.replace(/^www\./, "");
  return segments.join(" › ");
}
