import Dexie, { type Transaction } from "dexie";
import { createFallbackTitle, formatUrlIdentity, normalizeUrl } from "@/src/capture/normalizeUrl";
import type { PageCapture } from "@/src/capture/types";
import type {
  CreateSavedItemInput,
  LibraryItem,
  LibrarySavedView,
  PersistentTask,
  SavedItem,
  SavedView,
  Snapshot,
  Tag,
  UpdateSavedItemInput,
} from "@/src/domain/inspiration";
import { resolveDescription } from "@/src/domain/inspiration";
import { db, type WanderlandDatabase } from "./database";

const kindLabels = { website: "网站", article: "文章", follow: "关注源" } as const;
const systemViewId = "read-later";

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function formatSavedAt(timestamp: number) {
  const elapsed = Date.now() - timestamp;
  if (elapsed >= 0 && elapsed < 60_000) return "刚刚";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "short", day: "numeric" }).format(timestamp);
}

function normalizeTagName(name: string) {
  return name.trim().replace(/^#/, "").normalize("NFKC").toLocaleLowerCase("zh-CN");
}

export interface CreateSavedItemResult {
  created: boolean;
  item: SavedItem;
}

export interface ImportSavedItemsResult {
  added: number;
  skipped: number;
}

export interface DemoSeedItem {
  id: string;
  kind: SavedItem["kind"];
  title: string;
  siteHost: string;
  description: string;
  descriptionSource?: SavedItem["descriptionSource"];
  url: string;
  tags: string[];
  aiStatus: SavedItem["aiStatus"];
  isFavorite: boolean;
  cover: SavedItem["cover"];
  siteIcon?: string;
}

export class InspirationRepository {
  constructor(private readonly database: WanderlandDatabase = db) {}

  async initialize() {
    const existing = await this.database.savedViews.get(systemViewId);
    if (existing) return;
    const now = Date.now();
    await this.database.savedViews.put({
      id: systemViewId,
      name: "稍后阅读",
      isSystem: true,
      scope: "article",
      tagIds: [],
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  async listLibraryItems(): Promise<LibraryItem[]> {
    const [items, tags, snapshots] = await Promise.all([
      this.database.savedItems.orderBy("createdAt").reverse().toArray(),
      this.database.tags.toArray(),
      this.database.snapshots.toArray(),
    ]);
    const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));
    const snapshotsByItem = new Map(snapshots.map((snapshot) => [snapshot.itemId, snapshot]));
    return items.map((item) => ({
      ...item,
      title: !item.title.trim() || item.title === item.siteHost ? createFallbackTitle(item.canonicalUrl) : item.title,
      url: item.originalUrl,
      sourceLabel: formatUrlIdentity(item.canonicalUrl),
      tags: item.tagIds.flatMap((id) => tagsById.get(id) ?? []),
      savedAt: formatSavedAt(item.createdAt),
      snapshotText: snapshotsByItem.get(item.id)?.cleanText ?? "",
    }));
  }

  async getSnapshot(itemId: string) {
    return this.database.snapshots.where("itemId").equals(itemId).first();
  }

  async updateSavedItem(itemId: string, input: UpdateSavedItemInput) {
    const title = input.title.trim();
    if (!title) throw new Error("标题不能为空");
    const normalizedNames = [...new Set(input.tags.map(normalizeTagName).filter(Boolean))];
    const now = Date.now();
    await this.database.transaction("rw", this.database.savedItems, this.database.tags, async () => {
      const item = await this.database.savedItems.get(itemId);
      if (!item) throw new Error("收藏项不存在");
      const existingTags = normalizedNames.length
        ? await this.database.tags.where("normalizedName").anyOf(normalizedNames).toArray()
        : [];
      const existingByName = new Map(existingTags.map((tag) => [tag.normalizedName, tag]));
      const createdTags: Tag[] = normalizedNames.filter((name) => !existingByName.has(name)).map((name) => ({
        id: createId("tag"), name, normalizedName: name, aliases: [], usageCount: 0, createdAt: now, updatedAt: now,
      }));
      if (createdTags.length) await this.database.tags.bulkAdd(createdTags);
      createdTags.forEach((tag) => existingByName.set(tag.normalizedName, tag));
      const nextTagIds = normalizedNames.flatMap((name) => existingByName.get(name)?.id ?? []);
      const affectedIds = new Set([...item.tagIds, ...nextTagIds]);
      await this.database.savedItems.update(itemId, {
        title,
        description: input.description.trim(),
        descriptionSource: input.descriptionEdited === false ? item.descriptionSource : input.description.trim() ? "user" : undefined,
        tagIds: nextTagIds,
        cover: input.coverBlob ? { ...item.cover, image: undefined, blob: input.coverBlob, isUserSelected: true } : item.cover,
        updatedAt: now,
      });
      for (const tagId of affectedIds) {
        const usageCount = await this.database.savedItems.where("tagIds").equals(tagId).count();
        await this.database.tags.update(tagId, { usageCount, updatedAt: now });
      }
    });
  }

  async deleteSavedItem(itemId: string) {
    await this.database.transaction("rw", this.database.savedItems, this.database.snapshots, this.database.tasks, this.database.tags, async () => {
      const item = await this.database.savedItems.get(itemId);
      if (!item) return;
      await this.database.savedItems.delete(itemId);
      await this.database.snapshots.where("itemId").equals(itemId).delete();
      await this.database.tasks.where("itemId").equals(itemId).delete();
      for (const tagId of item.tagIds) {
        const usageCount = await this.database.savedItems.where("tagIds").equals(tagId).count();
        await this.database.tags.update(tagId, { usageCount, updatedAt: Date.now() });
      }
    });
  }

  async renameTag(tagId: string, name: string) {
    const normalizedName = normalizeTagName(name);
    if (!normalizedName) throw new Error("标签名称不能为空");
    const tag = await this.database.tags.get(tagId);
    if (!tag) throw new Error("标签不存在");
    const collision = await this.database.tags.where("normalizedName").equals(normalizedName).first();
    if (collision && collision.id !== tagId) return this.mergeTags(tagId, collision.id);
    await this.database.tags.update(tagId, { name: name.trim().replace(/^#/, ""), normalizedName, updatedAt: Date.now() });
  }

  async mergeTags(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    await this.database.transaction("rw", this.database.savedItems, this.database.savedViews, this.database.tags, async () => {
      const [source, target] = await Promise.all([this.database.tags.get(sourceId), this.database.tags.get(targetId)]);
      if (!source || !target) throw new Error("标签不存在");
      await this.database.savedItems.where("tagIds").equals(sourceId).modify((item) => {
        item.tagIds = [...new Set(item.tagIds.map((id) => id === sourceId ? targetId : id))];
      });
      await this.database.savedViews.where("tagIds").equals(sourceId).modify((view) => {
        view.tagIds = [...new Set(view.tagIds.map((id) => id === sourceId ? targetId : id))];
      });
      await this.database.tags.update(targetId, {
        aliases: [...new Set([...target.aliases, source.name, ...source.aliases])],
        usageCount: await this.database.savedItems.where("tagIds").equals(targetId).count(),
        updatedAt: Date.now(),
      });
      await this.database.tags.delete(sourceId);
    });
  }

  async deleteTag(tagId: string) {
    await this.database.transaction("rw", this.database.savedItems, this.database.savedViews, this.database.tags, async () => {
      await this.database.savedItems.where("tagIds").equals(tagId).modify((item) => { item.tagIds = item.tagIds.filter((id) => id !== tagId); });
      await this.database.savedViews.where("tagIds").equals(tagId).modify((view) => { view.tagIds = view.tagIds.filter((id) => id !== tagId); });
      await this.database.tags.delete(tagId);
    });
  }

  async listTags() {
    return this.database.tags.orderBy("usageCount").reverse().toArray();
  }

  async listLibrarySavedViews(): Promise<LibrarySavedView[]> {
    const [views, tags] = await Promise.all([
      this.database.savedViews.orderBy("sortOrder").toArray(),
      this.database.tags.toArray(),
    ]);
    const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));
    return views.map((view) => ({ ...view, tags: view.tagIds.flatMap((id) => tagsById.get(id) ?? []) }));
  }

  async createSavedItem(input: CreateSavedItemInput): Promise<CreateSavedItemResult> {
    const canonicalUrl = normalizeUrl(input.url);
    try {
      const result = await this.database.transaction("rw", this.database.savedItems, this.database.tasks, async () => {
        const existing = await this.database.savedItems.where("[kind+canonicalUrl]").equals([input.kind, canonicalUrl]).first();
        if (existing) return { created: false, item: existing };

        const parsed = new URL(canonicalUrl);
        const now = Date.now();
        const description = input.description?.trim() ?? "";
        const item: SavedItem = {
          id: createId(input.kind),
          originalUrl: input.url,
          canonicalUrl,
          siteHost: parsed.hostname.replace(/^www\./, ""),
          title: input.title?.trim() || createFallbackTitle(canonicalUrl),
          description,
          descriptionSource: description ? "user" : undefined,
          cover: {
            background: "var(--color-tag-surface)",
            foreground: "var(--color-brand)",
            label: kindLabels[input.kind],
            motif: input.kind === "follow" ? "orb" : "type",
          },
          kind: input.kind,
          tagIds: [],
          isFavorite: false,
          snapshotStatus: "pending",
          aiStatus: "pending",
          createdAt: now,
          updatedAt: now,
        };
        const task: PersistentTask = {
          id: createId("task"),
          itemId: item.id,
          type: "capture",
          status: "pending",
          attempts: 0,
          captureMethod: input.captureMethod,
          createdAt: now,
          updatedAt: now,
        };
        await this.database.savedItems.add(item);
        await this.database.tasks.add(task);
        return { created: true, item };
      });
      if (!input.description?.trim() && !input.tags?.length) return result;
      const readModel = (await this.listLibraryItems()).find((item) => item.id === result.item.id);
      await this.updateSavedItem(result.item.id, {
        title: result.item.title,
        description: input.description?.trim() || result.item.description,
        tags: [...new Set([...(readModel?.tags ?? []), ...(input.tags ?? [])])],
        descriptionEdited: Boolean(input.description?.trim()),
      });
      return { ...result, item: (await this.database.savedItems.get(result.item.id)) ?? result.item };
    } catch (error) {
      if (!(error instanceof Dexie.ConstraintError)) throw error;
      const existing = await this.database.savedItems.where("[kind+canonicalUrl]").equals([input.kind, canonicalUrl]).first();
      if (!existing) throw error;
      return { created: false, item: existing };
    }
  }

  async getSavedItem(id: string) {
    return this.database.savedItems.get(id);
  }

  async findSavedItem(kind: SavedItem["kind"], url: string) {
    return this.database.savedItems.where("[kind+canonicalUrl]").equals([kind, normalizeUrl(url)]).first();
  }

  async markCaptureStarted(itemId: string, captureMethod: PersistentTask["captureMethod"] = "active-tab") {
    const now = Date.now();
    await this.database.transaction("rw", this.database.savedItems, this.database.tasks, async () => {
      const item = await this.database.savedItems.get(itemId);
      if (!item) throw new Error("收藏项不存在");
      const task = await this.database.tasks.where("itemId").equals(itemId).and((candidate) => candidate.type === "capture").first();
      if (task) {
        await this.database.tasks.update(task.id, {
          status: "running",
          captureMethod,
          attempts: task.attempts + 1,
          lastError: undefined,
          updatedAt: now,
        });
      } else {
        await this.database.tasks.add({
          id: createId("task"), itemId, type: "capture", status: "running", attempts: 1,
          captureMethod, createdAt: now, updatedAt: now,
        });
      }
      await this.database.savedItems.update(itemId, { snapshotStatus: "pending", updatedAt: now });
    });
  }

  async completeCapture(itemId: string, capture: PageCapture) {
    return this.database.transaction(
      "rw",
      this.database.savedItems,
      this.database.snapshots,
      this.database.tasks,
      async () => {
        const sourceItem = await this.database.savedItems.get(itemId);
        if (!sourceItem) throw new Error("收藏项不存在");
        const candidateCanonical = normalizeUrl(capture.canonicalUrl || capture.url);
        const duplicate = await this.database.savedItems
          .where("[kind+canonicalUrl]")
          .equals([sourceItem.kind, candidateCanonical])
          .and((candidate) => candidate.id !== itemId)
          .first();
        const targetItem = duplicate ?? sourceItem;
        const now = Date.now();
        const snapshotId = targetItem.snapshotId ?? createId("snapshot");
        const snapshot: Snapshot = {
          id: snapshotId,
          itemId: targetItem.id,
          capturedAt: now,
          title: capture.title,
          byline: capture.byline,
          excerpt: capture.excerpt,
          cleanText: capture.cleanText,
          cleanHtml: capture.cleanHtml,
          captureMethod: "active-tab",
          completeness: capture.completeness,
          error: capture.completeness === "failed" ? "页面中没有可保存的正文内容" : undefined,
        };
        const nextDescription = resolveDescription(targetItem, { description: capture.description, source: "page" });
        // Only a page-authored social preview is suitable for a full-width cover.
        // Site logos and favicons remain identity metadata; stretching either into
        // the cover frame produces a misleading, low-quality result.
        const automaticImage = capture.ogImage;
        const nextCover = targetItem.cover.isUserSelected
          ? targetItem.cover
          : {
              ...targetItem.cover,
              image: automaticImage,
              blob: undefined,
              label: capture.title || targetItem.cover.label,
            };
        await this.database.snapshots.put(snapshot);
        await this.database.savedItems.update(targetItem.id, {
          canonicalUrl: candidateCanonical,
          siteHost: new URL(candidateCanonical).hostname.replace(/^www\./, ""),
          title: capture.title.trim() || targetItem.title,
          description: nextDescription.description,
          descriptionSource: nextDescription.descriptionSource,
          cover: nextCover,
          siteIcon: capture.favicon ?? targetItem.siteIcon,
          snapshotId,
          snapshotStatus: capture.completeness,
          updatedAt: now,
        });
        if (duplicate) {
          await this.database.snapshots.where("itemId").equals(sourceItem.id).delete();
          await this.database.tasks.where("itemId").equals(sourceItem.id).delete();
          await this.database.savedItems.delete(sourceItem.id);
        }
        const targetTask = await this.database.tasks.where("itemId").equals(targetItem.id).and((task) => task.type === "capture").first();
        if (targetTask) {
          await this.database.tasks.update(targetTask.id, {
            status: capture.completeness === "failed" ? "failed" : "complete",
            lastError: capture.completeness === "failed" ? snapshot.error : undefined,
            updatedAt: now,
          });
        } else {
          await this.database.tasks.add({
            id: createId("task"), itemId: targetItem.id, type: "capture",
            status: capture.completeness === "failed" ? "failed" : "complete",
            attempts: 1, captureMethod: "active-tab", createdAt: now, updatedAt: now,
            lastError: capture.completeness === "failed" ? snapshot.error : undefined,
          });
        }
        return { itemId: targetItem.id, mergedDuplicate: Boolean(duplicate) };
      },
    );
  }

  async failCapture(itemId: string, reason: string) {
    const now = Date.now();
    await this.database.transaction("rw", this.database.savedItems, this.database.tasks, async () => {
      await this.database.savedItems.update(itemId, { snapshotStatus: "failed", updatedAt: now });
      const task = await this.database.tasks.where("itemId").equals(itemId).and((candidate) => candidate.type === "capture").first();
      if (task) await this.database.tasks.update(task.id, { status: "failed", lastError: reason, updatedAt: now });
    });
  }

  async recoverInterruptedCaptureTasks() {
    const now = Date.now();
    await this.database.transaction("rw", this.database.savedItems, this.database.tasks, async () => {
      const interrupted = await this.database.tasks.where("status").equals("running").and((task) => task.type === "capture").toArray();
      if (!interrupted.length) return;
      const error = "浏览器后台在采集期间中断，请在来源页面重试。";
      await this.database.tasks.bulkUpdate(interrupted.map((task) => ({
        key: task.id,
        changes: { status: "failed", lastError: error, updatedAt: now },
      })));
      await this.database.savedItems.bulkUpdate(interrupted.map((task) => ({
        key: task.itemId,
        changes: { snapshotStatus: "failed", updatedAt: now },
      })));
    });
  }

  async importWebsiteUrls(urls: string[]): Promise<ImportSavedItemsResult> {
    let added = 0;
    let skipped = 0;
    for (const url of urls) {
      const result = await this.createSavedItem({ kind: "website", url, captureMethod: "import" });
      if (result.created) added += 1;
      else skipped += 1;
    }
    return { added, skipped };
  }

  async toggleFavorite(id: string) {
    await this.database.savedItems.where("id").equals(id).modify((item) => {
      item.isFavorite = !item.isFavorite;
      item.updatedAt = Date.now();
    });
  }

  async createSavedView(input: { name: string; scope: SavedView["scope"]; tags: string[] }) {
    const normalizedTags = input.tags.map(normalizeTagName);
    const tags = normalizedTags.length
      ? await this.database.tags.where("normalizedName").anyOf(normalizedTags).toArray()
      : [];
    const last = await this.database.savedViews.orderBy("sortOrder").last();
    const now = Date.now();
    const view: SavedView = {
      id: createId("saved-view"),
      name: input.name.trim() || "新快捷视图",
      isSystem: false,
      scope: input.scope,
      tagIds: tags.map((tag) => tag.id),
      sortOrder: (last?.sortOrder ?? 0) + 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.database.savedViews.add(view);
    return view;
  }

  async renameSavedView(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    await this.database.savedViews.where("id").equals(id).and((view) => !view.isSystem).modify({ name: trimmed, updatedAt: Date.now() });
  }

  async deleteSavedView(id: string) {
    await this.database.savedViews.where("id").equals(id).and((view) => !view.isSystem).delete();
  }

  async moveSavedView(sourceId: string, targetId: string) {
    await this.database.transaction("rw", this.database.savedViews, async (transaction) => {
      const views = await this.database.savedViews.orderBy("sortOrder").toArray();
      const systemViews = views.filter((view) => view.isSystem);
      const customViews = views.filter((view) => !view.isSystem);
      const sourceIndex = customViews.findIndex((view) => view.id === sourceId);
      if (sourceIndex < 0) return;
      const [moved] = customViews.splice(sourceIndex, 1);
      if (!moved) return;
      const targetIndex = targetId === systemViews[0]?.id ? 0 : customViews.findIndex((view) => view.id === targetId);
      customViews.splice(targetIndex < 0 ? customViews.length : targetIndex, 0, moved);
      await this.persistViewOrder(transaction, [...systemViews, ...customViews]);
    });
  }

  private async persistViewOrder(transaction: Transaction, views: SavedView[]) {
    const table = transaction.table<SavedView, string>("savedViews");
    const now = Date.now();
    await Promise.all(views.map((view, sortOrder) => table.update(view.id, { sortOrder, updatedAt: now })));
  }

  async seedDemoData(items: DemoSeedItem[]) {
    if (await this.database.savedItems.count()) return;
    const now = Date.now();
    await this.database.transaction("rw", this.database.savedItems, this.database.tags, async () => {
      const tagNames = [...new Set(items.flatMap((item) => item.tags))];
      const tags: Tag[] = tagNames.map((name, index) => ({
        id: `demo-tag-${index}`,
        name,
        normalizedName: normalizeTagName(name),
        aliases: [],
        usageCount: items.filter((item) => item.tags.includes(name)).length,
        createdAt: now,
        updatedAt: now,
      }));
      const tagIds = new Map(tags.map((tag) => [tag.name, tag.id]));
      await this.database.tags.bulkPut(tags);
      await this.database.savedItems.bulkPut(items.map((item, index) => ({
        id: item.id,
        originalUrl: item.url,
        canonicalUrl: normalizeUrl(item.url),
        siteHost: item.siteHost,
        title: item.title,
        description: item.description,
        descriptionSource: item.descriptionSource,
        cover: item.cover,
        kind: item.kind,
        tagIds: item.tags.flatMap((name) => tagIds.get(name) ?? []),
        isFavorite: item.isFavorite,
        snapshotStatus: item.aiStatus === "complete" ? "complete" : "pending",
        aiStatus: item.aiStatus,
        createdAt: now - index * 60_000,
        updatedAt: now - index * 60_000,
        siteIcon: item.siteIcon,
      })));
    });
  }
}

export const inspirationRepository = new InspirationRepository();
