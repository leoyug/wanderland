export interface PageMetadata {
  title: string;
  url: string;
  description: string;
  canonicalUrl?: string;
}

/**
 * 由 background 在用户主动收藏后通过 browser.scripting.executeScript 调用。
 * 不注册常驻 content script，避免扩大站点访问范围。
 */
export function readCurrentPage(): PageMetadata {
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? "";
  const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  return { title: document.title, url: location.href, description, canonicalUrl };
}
