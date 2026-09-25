import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WanderlandDatabase } from "./database";
import { InspirationRepository } from "./repository";
import { createBackup, parseBackup, restoreBackup } from "./backup";

vi.mock("dompurify", () => ({ default: { sanitize: (html: string) => html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") } }));

const names: string[] = [];
function makeDatabase() {
  const name = `wanderland-backup-test-${crypto.randomUUID()}`;
  names.push(name);
  return new WanderlandDatabase(name);
}

afterEach(async () => { await Promise.all(names.splice(0).map((name) => Dexie.delete(name))); });

describe("local backup", () => {
  it("round-trips items, cover blobs, snapshots and tags without overwriting existing items", async () => {
    const source = makeDatabase();
    const repository = new InspirationRepository(source);
    await repository.initialize();
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/page", tags: ["设计"] });
    await source.savedItems.update(created.item.id, { cover: { ...created.item.cover, blob: new Blob(["image-bytes"], { type: "image/png" }), isUserSelected: true } });
    await repository.completeCapture(created.item.id, {
      url: "https://example.com/page", canonicalUrl: "https://example.com/page", title: "Original",
      description: "Description", cleanHtml: "<p>Snapshot</p><script>bad()</script>", cleanText: "Snapshot", completeness: "complete",
    });
    await source.savedItems.update(created.item.id, { siteIconAutoBackground: "dark", siteIconBackgroundOverride: "light" });
    const backup = parseBackup(JSON.parse(JSON.stringify(await createBackup(source))) as unknown);
    expect(backup.savedItems).toHaveLength(1);
    expect(backup.savedItems[0]?.cover.blob).toMatch(/^data:image\/png;base64,/);

    const target = makeDatabase();
    const targetRepository = new InspirationRepository(target);
    await targetRepository.initialize();
    const existing = await targetRepository.createSavedItem({ kind: "article", url: "https://example.com/existing", title: "Keep me" });
    await target.snapshots.add({ id: backup.snapshots[0]!.id, itemId: existing.item.id, capturedAt: 1, title: "Existing snapshot", cleanText: "Keep", cleanHtml: "<p>Keep</p>", captureMethod: "manual-url", completeness: "complete" });
    const first = await restoreBackup(backup, target);
    const second = await restoreBackup(backup, target);
    expect(first).toMatchObject({ added: 1, skipped: 0 });
    expect(second).toMatchObject({ added: 0, skipped: 1, views: 0 });
    expect((await target.savedItems.get(existing.item.id))?.title).toBe("Keep me");
    expect((await target.snapshots.where("itemId").equals(existing.item.id).first())?.cleanText).toBe("Keep");
    const restored = await target.savedItems.where("canonicalUrl").equals("https://example.com/page").first();
    expect(restored?.cover.blob).toBeInstanceOf(Blob);
    expect(await restored?.cover.blob?.text()).toBe("image-bytes");
    expect(restored?.tagIds).toHaveLength(1);
    expect(restored?.siteIconAutoBackground).toBe("dark");
    expect(restored?.siteIconBackgroundOverride).toBe("light");
    const snapshot = await target.snapshots.where("itemId").equals(restored!.id).first();
    expect(snapshot?.id).toBe(restored?.snapshotId);
    expect(snapshot?.cleanHtml).not.toContain("<script>");
    source.close(); target.close();
  });

  it("rejects an unsupported or broken backup before writing", async () => {
    const target = makeDatabase();
    expect(() => parseBackup({ format: "wanderland-backup", version: 999 })).toThrow("备份格式无效");
    const source = makeDatabase();
    const repository = new InspirationRepository(source);
    await repository.createSavedItem({ kind: "website", url: "https://example.com" });
    const backup = await createBackup(source);
    backup.savedItems[0]!.tagIds = ["missing-tag"];
    expect(() => parseBackup(backup)).toThrow("关联数据无效");
    expect(await target.savedItems.count()).toBe(0);
    source.close(); target.close();
  });
});
