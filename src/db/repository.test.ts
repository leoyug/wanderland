import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import type { SavedItem } from "@/src/domain/inspiration";
import type { PageCapture } from "@/src/capture/types";
import { WanderlandDatabase } from "./database";
import { InspirationRepository } from "./repository";

const databaseNames: string[] = [];

function createDatabase() {
  const name = `wanderland-test-${crypto.randomUUID()}`;
  databaseNames.push(name);
  return new WanderlandDatabase(name);
}

function createCapture(overrides: Partial<PageCapture> = {}): PageCapture {
  return {
    url: "https://example.com/article",
    canonicalUrl: "https://example.com/article",
    title: "A captured article",
    description: "Page description",
    cleanText: "Readable article text",
    cleanHtml: "<article><p>Readable article text</p></article>",
    completeness: "complete",
    favicon: "https://example.com/favicon.ico",
    ...overrides,
  };
}

afterEach(async () => {
  await Promise.all(databaseNames.splice(0).map((name) => Dexie.delete(name)));
});

describe("InspirationRepository", () => {
  it("deduplicates normalized URLs within the same content type", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);

    const first = await repository.createSavedItem({ kind: "website", url: "https://Example.com/work/?utm_source=test#intro" });
    const duplicate = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    const otherKind = await repository.createSavedItem({ kind: "article", url: "https://example.com/work" });

    expect(first.created).toBe(true);
    expect(duplicate).toEqual({ created: false, item: first.item });
    expect(otherKind.created).toBe(true);
    expect(await database.savedItems.count()).toBe(2);
    expect(await database.tasks.count()).toBe(4);
    database.close();
  });

  it("keeps same-site subpages separate and gives them distinct temporary identities", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    await repository.createSavedItem({ kind: "website", url: "https://example.com/gallery/web-design" });
    await repository.createSavedItem({ kind: "website", url: "https://example.com/gallery/motion-design" });

    const items = await repository.listLibraryItems();
    expect(items).toHaveLength(2);
    expect(new Set(items.map((item) => item.title))).toEqual(new Set(["gallery › motion design", "gallery › web design"]));
    expect(new Set(items.map((item) => item.sourceLabel))).toEqual(new Set([
      "example.com/gallery/motion-design",
      "example.com/gallery/web-design",
    ]));
    database.close();
  });

  it("persists favorite and saved-view state across database instances", async () => {
    const database = createDatabase();
    const name = database.name;
    const repository = new InspirationRepository(database);
    await repository.initialize();
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/read" });
    await repository.toggleFavorite(created.item.id);
    const view = await repository.createSavedView({ name: "本周阅读", scope: "article", tags: [] });
    database.close();

    const reopened = new WanderlandDatabase(name);
    const reopenedRepository = new InspirationRepository(reopened);
    expect((await reopenedRepository.listLibraryItems())[0]?.isFavorite).toBe(true);
    expect((await reopenedRepository.listLibrarySavedViews()).map((candidate) => candidate.id)).toContain(view.id);
    reopened.close();
  });

  it("keeps existing records when upgrading the schema", async () => {
    const name = `wanderland-migration-${crypto.randomUUID()}`;
    databaseNames.push(name);
    const legacy = new Dexie(name);
    legacy.version(1).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,aiStatus,createdAt,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt",
    });
    await legacy.open();
    const legacyItem = {
      id: "legacy-item",
      originalUrl: "https://example.com/legacy",
      canonicalUrl: "https://example.com/legacy",
      siteHost: "example.com",
      title: "Legacy",
      description: "",
      cover: { background: "#fff", foreground: "#000", label: "Legacy", motif: "type" },
      kind: "website",
      isFavorite: false,
      aiStatus: "pending",
      createdAt: 100,
      updatedAt: 100,
    };
    await legacy.table("savedItems").add(legacyItem);
    legacy.close();

    const upgraded = new WanderlandDatabase(name);
    await upgraded.open();
    const item = await upgraded.savedItems.get("legacy-item") as SavedItem;
    expect(item.title).toBe("Legacy");
    expect(item.tagIds).toEqual([]);
    expect(item.snapshotStatus).toBe("pending");
    expect(await upgraded.snapshots.count()).toBe(0);
    upgraded.close();
  });

  it("persists a sanitized snapshot and preserves a user description", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({
      kind: "article",
      url: "https://example.com/article",
      description: "My own note",
      captureMethod: "active-tab",
    });

    await repository.markCaptureStarted(created.item.id);
    await repository.completeCapture(created.item.id, createCapture({ ogImage: "https://example.com/cover.jpg" }));

    const item = await database.savedItems.get(created.item.id);
    const snapshot = await database.snapshots.where("itemId").equals(created.item.id).first();
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "capture").first();
    expect(item).toMatchObject({
      title: "A captured article",
      description: "My own note",
      descriptionSource: "user",
      snapshotStatus: "complete",
      siteIcon: "https://example.com/favicon.ico",
    });
    expect(item?.cover.image).toBe("https://example.com/cover.jpg");
    expect(snapshot).toMatchObject({ cleanText: "Readable article text", completeness: "complete", captureMethod: "active-tab" });
    expect(task).toMatchObject({ status: "complete", attempts: 1 });
    database.close();
  });

  it("uses only an Open Graph image as an automatic cover", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });

    await repository.completeCapture(created.item.id, createCapture({
      ogImage: undefined,
      favicon: "https://example.com/favicon.ico",
    }));

    const item = await database.savedItems.get(created.item.id);
    expect(item?.cover.image).toBeUndefined();
    expect(item?.cover.blob).toBeUndefined();
    expect(item?.siteIcon).toBe("https://example.com/favicon.ico");
    database.close();
  });

  it("merges a captured canonical duplicate instead of creating two items", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const canonical = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    const alias = await repository.createSavedItem({ kind: "article", url: "https://example.com/article?edition=feed" });

    const result = await repository.completeCapture(alias.item.id, createCapture());

    expect(result).toEqual({ itemId: canonical.item.id, mergedDuplicate: true });
    expect(await database.savedItems.count()).toBe(1);
    expect(await database.snapshots.where("itemId").equals(canonical.item.id).count()).toBe(1);
    expect(await database.tasks.where("itemId").equals(alias.item.id).count()).toBe(0);
    database.close();
  });

  it("marks interrupted capture tasks and items as failed for manual retry", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    await repository.markCaptureStarted(created.item.id);

    await repository.recoverInterruptedCaptureTasks();

    expect(await database.savedItems.get(created.item.id)).toMatchObject({ snapshotStatus: "failed" });
    expect(await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "capture").first()).toMatchObject({
      status: "failed",
      attempts: 1,
      lastError: "浏览器后台在采集期间中断，请在来源页面重试。",
    });
    database.close();
  });

  it("updates editable fields, creates reusable tags, and locks a manual cover", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com/work" });
    const coverBlob = new Blob(["cover"], { type: "image/png" });

    await repository.updateSavedItem(created.item.id, {
      title: "Edited title", description: "Edited description", tags: ["设计", "#前端", "设计"], coverBlob,
    });

    const item = await database.savedItems.get(created.item.id);
    const tags = await database.tags.toArray();
    expect(item).toMatchObject({ title: "Edited title", description: "Edited description", descriptionSource: "user" });
    expect(item?.cover).toMatchObject({ blob: coverBlob, isUserSelected: true });
    expect(tags.map((tag) => [tag.name, tag.usageCount])).toEqual(expect.arrayContaining([["设计", 1], ["前端", 1]]));
    expect(item?.tagIds).toHaveLength(2);
    database.close();
  });

  it("adds selected popup tags without duplicating an existing item", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const first = await repository.createSavedItem({ kind: "website", url: "https://example.com/work", tags: ["设计"] });
    const second = await repository.createSavedItem({ kind: "website", url: "https://example.com/work#top", tags: ["前端"] });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(await database.savedItems.count()).toBe(1);
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(expect.arrayContaining(["设计", "前端"]));
    database.close();
  });

  it("merges colliding tag renames and removes deleted items with their snapshot and task", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    await repository.updateSavedItem(created.item.id, { title: "Article", description: "", tags: ["UI", "界面"] });
    const tags = await repository.listTags();
    const ui = tags.find((tag) => tag.name === "ui")!;
    const interfaceTag = tags.find((tag) => tag.name === "界面")!;
    await repository.renameTag(ui.id, "界面");
    await repository.completeCapture(created.item.id, createCapture());

    expect(await database.tags.get(ui.id)).toBeUndefined();
    expect((await database.savedItems.get(created.item.id))?.tagIds).toEqual([interfaceTag.id]);
    expect((await database.tags.get(interfaceTag.id))?.aliases).toContain("ui");

    await repository.deleteSavedItem(created.item.id);
    expect(await database.savedItems.count()).toBe(0);
    expect(await database.snapshots.count()).toBe(0);
    expect(await database.tasks.count()).toBe(0);
    database.close();
  });

  it("applies validated AI output without replacing page descriptions", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "article", url: "https://example.com/article" });
    await repository.completeCapture(created.item.id, createCapture({ description: "Page description" }));
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();

    await repository.markAiStarted(task!.id);
    await repository.completeAiTask(task!.id, { description: "AI description", tags: ["设计", "前端", "无障碍"] });

    const item = await database.savedItems.get(created.item.id);
    expect(item).toMatchObject({ description: "Page description", descriptionSource: "page", aiStatus: "complete" });
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(expect.arrayContaining(["设计", "前端", "无障碍"]));
    expect(await database.tasks.get(task!.id)).toMatchObject({ status: "complete", attempts: 1 });
    database.close();
  });

  it("never changes tags after the user has edited them", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com", description: "User description", tags: ["人工标签"] });
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();

    await repository.markAiStarted(task!.id);
    await repository.completeAiTask(task!.id, { description: "AI description", tags: ["设计", "前端", "工具"] });

    const item = await database.savedItems.get(created.item.id);
    expect(item).toMatchObject({ description: "User description", descriptionSource: "user", aiStatus: "complete" });
    expect((await repository.listLibraryItems())[0]?.tags).toEqual(["人工标签"]);
    database.close();
  });

  it("persists AI failure details and makes interrupted work retryable", async () => {
    const database = createDatabase();
    const repository = new InspirationRepository(database);
    const created = await repository.createSavedItem({ kind: "website", url: "https://example.com" });
    const task = await database.tasks.where("itemId").equals(created.item.id).and((candidate) => candidate.type === "ai").first();
    await repository.markAiStarted(task!.id);

    await repository.recoverInterruptedAiTasks();

    expect(await database.savedItems.get(created.item.id)).toMatchObject({ aiStatus: "failed" });
    expect(await database.tasks.get(task!.id)).toMatchObject({
      status: "failed",
      attempts: 1,
      lastError: "浏览器后台在 AI 处理期间中断，可重试。",
    });
    database.close();
  });
});
