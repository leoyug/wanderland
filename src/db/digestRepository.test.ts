import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { buildDigest, digestPeriod, localDateKey } from "@/src/domain/digest";
import type { LibraryItem } from "@/src/domain/inspiration";
import { WanderlandDatabase } from "./database";
import { InspirationRepository } from "./repository";
import { DigestRepository } from "./digestRepository";

const names: string[] = [];
function database() { const name = `digest-test-${crypto.randomUUID()}`; names.push(name); return new WanderlandDatabase(name); }
const date = (day: number, hour = 12) => new Date(2026, 8, day, hour).getTime();
function item(id: string, day: number, overrides: Partial<LibraryItem> = {}): LibraryItem {
  return { id, kind: "website", title: id, siteHost: "example.com", description: `Description of ${id}`, originalUrl: `https://example.com/${id}`, canonicalUrl: `https://example.com/${id}`, url: `https://example.com/${id}`, sourceLabel: "example.com", tags: ["设计"], tagIds: [], isFavorite: false, aiStatus: "complete", snapshotStatus: "pending", savedAt: "", snapshotText: "", createdAt: date(day), updatedAt: date(day), cover: { background: "var(--color-surface)", foreground: "var(--color-ink)", label: "", motif: "type" }, ...overrides };
}
afterEach(async () => { await Promise.all(names.splice(0).map((name) => Dexie.delete(name))); });
describe("content digests", () => {
  it("uses a local Monday-to-Sunday week and excludes the following Monday", () => {
    const period = digestPeriod("weekly", date(27));
    expect(localDateKey(period.start)).toBe("2026.09.21");
    expect(localDateKey(period.end)).toBe("2026.09.28");
    const digest = buildDigest("weekly", period.start, [item("first", 21, { createdAt: period.start }), item("last", 27), item("next", 28, { createdAt: period.end }), item("archived", 23, { archivedAt: date(24) })]);
    expect(digest.entries.map((entry) => entry.id)).toEqual(["first", "last"]);
  });
  it("keeps all weekly items, picks up to three earlier items and prioritizes favorites", () => {
    const current = Array.from({ length: 14 }, (_, index) => item(`current-${index}`, 22));
    const old = [item("old-1", 20), item("old-2", 19), item("favorite", 1, { isFavorite: true }), item("old-3", 18), item("duplicate-current", 18, { canonicalUrl: current[0]!.canonicalUrl })];
    const digest = buildDigest("weekly", date(21), [...current, ...old]);
    expect(digest.entries).toHaveLength(14);
    expect(digest.retrospective.map((entry) => entry.id)).toEqual(["favorite", "old-1", "old-2"]);
    expect(buildDigest("daily", date(22), [...current, ...old]).retrospective).toEqual([]);
  });
  it("deduplicates concurrent generation and preserves content and read state after edits and reopen", async () => {
    const db = database(); const repo = new InspirationRepository(db); const digests = new DigestRepository(db);
    const added = await repo.createSavedItem({ kind: "article", url: "https://example.com/article", title: "Original title", description: "User description" });
    await db.savedItems.update(added.item.id, { createdAt: date(24) });
    const [first, second] = await Promise.all([digests.generate("daily", date(24)), digests.generate("daily", date(24))]);
    expect(first.id).toBe(second.id); expect(await db.digests.count()).toBe(1);
    await digests.markRead(first.id);
    await db.savedItems.update(added.item.id, { title: "Edited title" });
    db.close();
    const reopened = new WanderlandDatabase(db.name);
    const saved = await new DigestRepository(reopened).generate("daily", date(24));
    expect(saved.entries[0]!.title).toBe("Original title"); expect(saved.readAt).toBeTypeOf("number"); reopened.close();
  });
  it("only automatically generates completed weeks, including retrospective-only latest weeks", async () => {
    const db = database(); const repo = new InspirationRepository(db); const digests = new DigestRepository(db);
    const old = await repo.createSavedItem({ kind: "website", url: "https://example.com/old" });
    const current = await repo.createSavedItem({ kind: "website", url: "https://example.com/current" });
    await db.savedItems.update(old.item.id, { createdAt: date(10) }); await db.savedItems.update(current.item.id, { createdAt: date(28) });
    await Promise.all([digests.ensureWeeklyDigests(date(28)), digests.ensureWeeklyDigests(date(28))]);
    const records = await digests.list("weekly");
    expect(records.map((record) => record.id)).toEqual(["weekly-2026.09.21", "weekly-2026.09.07"]);
    expect(records[0]!.entries).toHaveLength(0); expect(records[0]!.retrospective.map((entry) => entry.id)).toEqual([old.item.id]); db.close();
  });
  it("upgrades existing collections without losing records", async () => {
    const name = `digest-test-${crypto.randomUUID()}`; names.push(name);
    const legacy = new Dexie(name);
    legacy.version(6).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,archivedAt,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    });
    await legacy.table("savedItems").put(item("legacy", 24)); legacy.close();
    const reopened = new WanderlandDatabase(name); await reopened.open();
    expect(await reopened.savedItems.count()).toBe(1); expect(await reopened.digests.count()).toBe(0); reopened.close();
  });
});
