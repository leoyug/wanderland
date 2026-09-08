import MiniSearch from "minisearch";
import type { LibraryItem } from "@/src/domain/inspiration";

type SearchRecord = Pick<LibraryItem, "id" | "title" | "description" | "siteHost" | "snapshotText"> & { tags: string };

function tokenize(text: string) {
  if (!("Segmenter" in Intl)) return text.toLocaleLowerCase("zh-CN").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const segmenter = new Intl.Segmenter(["zh-CN", "en"], { granularity: "word" });
  return [...segmenter.segment(text.toLocaleLowerCase("zh-CN"))].filter((part) => part.isWordLike).map((part) => part.segment);
}

export function createLibrarySearchIndex(items: LibraryItem[]) {
  const index = new MiniSearch<SearchRecord>({
    fields: ["title", "description", "siteHost", "tags", "snapshotText"],
    storeFields: ["id"],
    tokenize,
    searchOptions: {
      prefix: true,
      fuzzy: (term) => term.length >= 5 ? 0.2 : false,
      boost: { title: 5, tags: 4, description: 3, siteHost: 2, snapshotText: 1 },
    },
  });
  index.addAll(items.map((item) => ({
    id: item.id, title: item.title, description: item.description, siteHost: item.siteHost,
    tags: item.tags.join(" "), snapshotText: item.snapshotText,
  })));
  const allIds = new Set(items.map((item) => item.id));
  return {
    search(query: string) {
      const normalized = query.trim();
      return normalized ? new Set(index.search(normalized).map((result) => String(result.id))) : allIds;
    },
  };
}

export function searchLibrary(items: LibraryItem[], query: string) {
  return createLibrarySearchIndex(items).search(query);
}
