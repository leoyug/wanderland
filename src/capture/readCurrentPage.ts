import DOMPurify from "dompurify";
import { Readability } from "@mozilla/readability";
import type { PageCapture } from "./types";

const MAX_HTML_LENGTH = 2_000_000;
const MAX_TEXT_LENGTH = 1_000_000;

function metaContent(...selectors: string[]) {
  for (const selector of selectors) {
    const content = document.querySelector<HTMLMetaElement>(selector)?.content.trim();
    if (content) return content;
  }
  return "";
}

function absoluteUrl(value?: string | null) {
  if (!value) return undefined;
  try {
    return new URL(value, location.href).href;
  } catch {
    return undefined;
  }
}

function compact(value: string, limit: number) {
  const normalized = value.replace(/\u0000/g, "").trim();
  return { value: normalized.slice(0, limit), truncated: normalized.length > limit };
}

/** Runs only after an explicit user action through scripting.executeScript. */
export function readCurrentPage(): PageCapture {
  const clonedDocument = document.cloneNode(true) as Document;
  const article = new Readability(clonedDocument).parse();
  const fallbackRoot = document.querySelector("main, article, [role='main']") ?? document.body;
  const sourceHtml = article?.content || fallbackRoot?.innerHTML || "";
  const sourceText = article?.textContent || fallbackRoot?.textContent || "";
  const cleanHtmlResult = compact(DOMPurify.sanitize(sourceHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "form", "input", "button", "iframe", "object", "embed"],
    FORBID_ATTR: ["style", "srcdoc"],
  }), MAX_HTML_LENGTH);
  const cleanTextResult = compact(sourceText.replace(/\s+/g, " "), MAX_TEXT_LENGTH);
  const hasReadableArticle = Boolean(article?.content && cleanTextResult.value.length >= 200);
  const hasFallback = cleanTextResult.value.length > 0;
  const completeness = !hasFallback
    ? "failed"
    : hasReadableArticle && !cleanHtmlResult.truncated && !cleanTextResult.truncated
      ? "complete"
      : "partial";

  const canonicalUrl = absoluteUrl(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href);
  const favicon = absoluteUrl(document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href);

  return {
    title: metaContent('meta[property="og:title"]', 'meta[name="twitter:title"]') || document.title.trim(),
    url: location.href,
    description: metaContent('meta[property="og:description"]', 'meta[name="description"]', 'meta[name="twitter:description"]'),
    canonicalUrl,
    siteName: metaContent('meta[property="og:site_name"]') || undefined,
    byline: article?.byline || undefined,
    excerpt: article?.excerpt || undefined,
    cleanText: cleanTextResult.value,
    cleanHtml: cleanHtmlResult.value,
    completeness,
    ogImage: absoluteUrl(metaContent('meta[property="og:image"]', 'meta[name="twitter:image"]')),
    favicon,
  };
}
