import type { PageCapture } from "./types";

const namedEntities: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };

function decodeEntities(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const radix = code[1]?.toLowerCase() === "x" ? 16 : 10;
      const number = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix);
      return Number.isFinite(number) && number >= 0 && number <= 0x10ffff
        ? String.fromCodePoint(number)
        : entity;
    }
    return namedEntities[code.toLowerCase()] ?? entity;
  });
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decodeEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
}

function absoluteUrl(value: string, baseUrl: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function readRemoteMetadata(html: string, requestedUrl: string, responseUrl = requestedUrl): PageCapture {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const metaContent = (...keys: string[]) => {
    for (const key of keys) {
      const tag = meta.find((candidate) => [attribute(candidate, "property"), attribute(candidate, "name")].some((value) => value.toLowerCase() === key));
      const content = tag ? attribute(tag, "content") : "";
      if (content) return content;
    }
    return "";
  };
  const linkHref = (predicate: (rel: string) => boolean) => {
    const tag = links.find((candidate) => predicate(attribute(candidate, "rel").toLowerCase()));
    return tag ? absoluteUrl(attribute(tag, "href"), responseUrl) : undefined;
  };
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(titleMatch?.[1] ?? "").replace(/\s+/g, " ").trim();
  return {
    url: responseUrl,
    canonicalUrl: linkHref((rel) => rel.split(/\s+/).includes("canonical")),
    title: metaContent("og:title", "twitter:title") || title || new URL(requestedUrl).hostname,
    description: metaContent("og:description", "description", "twitter:description"),
    siteName: metaContent("og:site_name") || undefined,
    cleanText: "",
    cleanHtml: "",
    completeness: "partial",
    ogImage: absoluteUrl(metaContent("og:image", "twitter:image"), responseUrl),
    favicon: linkHref((rel) => rel.split(/\s+/).includes("icon")) ?? absoluteUrl("/favicon.ico", responseUrl),
  };
}
