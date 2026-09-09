export function getSiteIconCandidates(siteIcon: string | undefined, pageUrl: string) {
  let rootFavicon: string | undefined;
  try {
    const url = new URL(pageUrl);
    if (url.protocol === "http:" || url.protocol === "https:") rootFavicon = new URL("/favicon.ico", url.origin).href;
  } catch {
    rootFavicon = undefined;
  }

  return [...new Set([siteIcon, rootFavicon].filter((candidate): candidate is string => Boolean(candidate)))];
}
