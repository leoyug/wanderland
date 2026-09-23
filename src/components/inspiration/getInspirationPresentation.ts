import type { LibraryItem } from "@/src/domain/inspiration";

const xHosts = new Set(["x.com", "twitter.com"]);

function getPostCopy(text: string) {
  const trimmed = text.trim();
  const boundary = trimmed.search(/[。！？]|[.!?](?=\s|$)/u);
  if (boundary < 0) return { title: trimmed, description: "" };

  const end = boundary + 1;
  const title = trimmed.slice(0, end).trim();
  const description = trimmed.slice(end).trim();
  return description ? { title, description } : { title: trimmed, description: "" };
}

export function getInspirationPresentation(item: LibraryItem) {
  let url: URL;
  try {
    url = new URL(item.url);
  } catch {
    return { title: item.title, description: item.description, sourceLabel: item.sourceLabel };
  }

  const host = url.hostname.toLocaleLowerCase("en-US").replace(/^www\./, "");
  const status = url.pathname.match(/^\/([^/]+)\/status\/\d+/i);
  if (!xHosts.has(host) || !status) {
    return { title: item.title, description: item.description, sourceLabel: item.sourceLabel };
  }

  const profileHandle = status[1];
  if (!profileHandle) {
    return { title: item.title, description: item.description, sourceLabel: item.sourceLabel };
  }

  const generatedTitle = item.title.match(/^.+?\s+\(@?([^)]+)\)\s+on\s+X$/i);
  const handle = generatedTitle?.[1]?.trim() || profileHandle;
  const postText = item.description.trim();
  const postCopy = generatedTitle && postText ? getPostCopy(postText) : null;

  return {
    title: postCopy?.title || item.title,
    description: postCopy?.description ?? item.description,
    sourceLabel: `@${handle.replace(/^@/, "")}`,
  };
}
