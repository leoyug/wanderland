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
