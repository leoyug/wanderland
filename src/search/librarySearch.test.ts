import { describe, expect, it } from "vitest";
import type { LibraryItem } from "@/src/domain/inspiration";
import { searchLibrary } from "./librarySearch";

const base = {
  originalUrl: "https://example.com", canonicalUrl: "https://example.com", url: "https://example.com",
  siteHost: "example.com", sourceLabel: "example.com", title: "Grid system", description: "Layout reference",
  descriptionSource: "page" as const, cover: { background: "", foreground: "", label: "", motif: "grid" as const },
  kind: "article" as const, tagIds: [], tags: ["设计"], isFavorite: false, snapshotStatus: "complete" as const,
  aiStatus: "pending" as const, createdAt: 1, updatedAt: 1, savedAt: "刚刚", snapshotText: "正文讨论响应式排版与无障碍设计",
};

describe("searchLibrary", () => {
  const items: LibraryItem[] = [{ ...base, id: "one" }, { ...base, id: "two", title: "Motion", tags: ["动效"], snapshotText: "spring animation" }];
  it("searches title and tags with useful weighting", () => expect([...searchLibrary(items, "Grid")]).toEqual(["one"]));
  it("finds Chinese terms that only exist in snapshot text", () => expect([...searchLibrary(items, "无障碍")]).toEqual(["one"]));
  it("supports English prefixes", () => expect([...searchLibrary(items, "anim")]).toEqual(["two"]));
});
