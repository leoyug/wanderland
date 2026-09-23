import { z } from "zod";
import DOMPurify from "dompurify";
import type { PersistentTask, SavedItem, SavedView, Snapshot, Tag } from "@/src/domain/inspiration";
import { db, type WanderlandDatabase } from "./database";

const backupSchema = z.object({
  format: z.literal("wanderland-backup"),
  version: z.literal(1),
  exportedAt: z.number().finite(),
  savedItems: z.array(z.object({
    id: z.string().min(1), kind: z.enum(["website", "article", "follow"]),
    canonicalUrl: z.string().url(), originalUrl: z.string().url(),
    title: z.string(), siteHost: z.string(), description: z.string(),
    tagIds: z.array(z.string()), cover: z.object({ background: z.string(), foreground: z.string(), label: z.string(), motif: z.enum(["type", "grid", "orb"]), blob: z.string().optional() }).passthrough(),
    isFavorite: z.boolean(), snapshotStatus: z.enum(["pending", "complete", "partial", "failed"]),
    aiStatus: z.enum(["pending", "complete", "failed"]), createdAt: z.number(), updatedAt: z.number(),
    snapshotId: z.string().optional(),
  }).passthrough()),
  snapshots: z.array(z.object({ id: z.string().min(1), itemId: z.string().min(1), cleanHtml: z.string(), cleanText: z.string() }).passthrough()),
  tags: z.array(z.object({ id: z.string().min(1), name: z.string(), normalizedName: z.string().min(1), aliases: z.array(z.string()), usageCount: z.number(), createdAt: z.number(), updatedAt: z.number() }).passthrough()),
  savedViews: z.array(z.object({ id: z.string().min(1), name: z.string(), scope: z.enum(["all", "unprocessed", "favorites", "website", "article", "follow"]), tagIds: z.array(z.string()), isSystem: z.boolean(), sortOrder: z.number(), createdAt: z.number(), updatedAt: z.number() }).passthrough()),
  tasks: z.array(z.object({ id: z.string().min(1), itemId: z.string().min(1), type: z.enum(["capture", "ai"]), status: z.enum(["pending", "running", "failed", "complete"]), attempts: z.number(), createdAt: z.number(), updatedAt: z.number() }).passthrough()),
});

export type Backup = z.infer<typeof backupSchema>;

function encodeBytes(bytes: Uint8Array) {
  let value = "";
  for (let index = 0; index < bytes.length; index += 8192) value += String.fromCharCode(...bytes.subarray(index, index + 8192));
  return btoa(value);
}

async function encodeCover(item: SavedItem) {
  const blob = item.cover.blob;
  return { ...item, cover: { ...item.cover, blob: blob ? `data:${blob.type || "application/octet-stream"};base64,${encodeBytes(new Uint8Array(await blob.arrayBuffer()))}` : undefined } };
}

function decodeCover(item: Backup["savedItems"][number]): SavedItem {
  const { blob, ...cover } = item.cover;
  if (!blob) return { ...item, cover } as SavedItem;
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(blob);
  if (!match) throw new Error("备份中的封面图片格式无效。");
  const binary = atob(match[2]!);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { ...item, cover: { ...cover, blob: new Blob([bytes], { type: match[1] }) } } as SavedItem;
}

export async function createBackup(database: WanderlandDatabase = db) {
  // Read every store in one readonly transaction to produce a consistent snapshot.
  const [savedItems, snapshots, tags, savedViews, tasks] = await database.transaction("r", database.savedItems, database.snapshots, database.tags, database.savedViews, database.tasks, async () => Promise.all([
    database.savedItems.toArray(), database.snapshots.toArray(), database.tags.toArray(), database.savedViews.toArray(), database.tasks.toArray(),
  ]));
  return {
    format: "wanderland-backup" as const,
    version: 1 as const,
    exportedAt: Date.now(),
    savedItems: await Promise.all(savedItems.map(encodeCover)),
    snapshots, tags, savedViews, tasks: tasks.map(({ lastError: _lastError, ...task }) => task),
  };
}

export function parseBackup(value: unknown): Backup {
  const result = backupSchema.safeParse(value);
  if (!result.success) throw new Error("备份格式无效或版本不受支持。请选择 Wanderland 导出的 JSON 文件。");
  const backup = result.data;
  const unique = (values: string[]) => values.length === new Set(values).size;
  if (!unique(backup.savedItems.map((item) => item.id)) || !unique(backup.savedItems.map((item) => `${item.kind}\0${item.canonicalUrl}`)) || !unique(backup.tags.map((tag) => tag.id)) || !unique(backup.tags.map((tag) => tag.normalizedName)) || !unique(backup.snapshots.map((snapshot) => snapshot.id)) || !unique(backup.savedViews.map((view) => view.id)) || !unique(backup.tasks.map((task) => task.id))) throw new Error("备份中包含重复记录，未进行恢复。");
  const itemIds = new Set(backup.savedItems.map((item) => item.id));
  const tagIds = new Set(backup.tags.map((tag) => tag.id));
  const snapshotIds = new Set(backup.snapshots.map((snapshot) => snapshot.id));
  if (backup.savedItems.some((item) => item.tagIds.some((id) => !tagIds.has(id)) || (item.snapshotId && !snapshotIds.has(item.snapshotId)) || !/^https?:$/.test(new URL(item.canonicalUrl).protocol) || !/^https?:$/.test(new URL(item.originalUrl).protocol)) || backup.snapshots.some((snapshot) => !itemIds.has(snapshot.itemId)) || backup.tasks.some((task) => !itemIds.has(task.itemId)) || backup.savedViews.some((view) => view.tagIds.some((id) => !tagIds.has(id)))) throw new Error("备份中的网址或关联数据无效，未进行恢复。");
  for (const item of backup.savedItems) decodeCover(item);
  return backup;
}

export async function restoreBackup(backup: Backup, database: WanderlandDatabase = db) {
  // Revalidate at the write boundary, even when called without the import dialog.
  const valid = parseBackup(backup);
  const items = valid.savedItems.map(decodeCover);
  return database.transaction("rw", database.savedItems, database.snapshots, database.tags, database.savedViews, database.tasks, async () => {
    const [existingItems, existingTags, existingViews, existingTasks, existingSnapshots] = await Promise.all([
      database.savedItems.toArray(), database.tags.toArray(), database.savedViews.toArray(), database.tasks.toArray(), database.snapshots.toArray(),
    ]);
    const usedIds = new Set([...existingItems, ...existingTags, ...existingViews, ...existingTasks, ...existingSnapshots].map((record) => record.id));
    const nextId = (id: string) => { let result = id; while (usedIds.has(result)) result = `${id}-${crypto.randomUUID()}`; usedIds.add(result); return result; };
    const tagMap = new Map<string, string>();
    const identityFor = (name: string) => name.trim().replace(/^#/, "").normalize("NFKC");
    const tagsByName = new Map(existingTags.map((tag) => [identityFor(tag.name), tag.id]));
    const tagsToAdd: Tag[] = [];
    for (const tag of valid.tags) {
      const normalizedName = identityFor(tag.name);
      const existing = tagsByName.get(normalizedName);
      const id = existing ?? nextId(tag.id);
      tagMap.set(tag.id, id);
      if (!existing) { tagsToAdd.push({ ...tag, id, normalizedName, usageCount: 0 }); tagsByName.set(normalizedName, id); }
    }
    const existingKeys = new Set(existingItems.map((item) => `${item.kind}\0${item.canonicalUrl}`));
    const itemMap = new Map<string, string>();
    const snapshotMap = new Map(valid.snapshots.map((snapshot) => [snapshot.id, nextId(snapshot.id)]));
    const itemsToAdd: SavedItem[] = [];
    for (const item of items) {
      const key = `${item.kind}\0${item.canonicalUrl}`;
      if (existingKeys.has(key)) continue;
      const id = nextId(item.id);
      itemMap.set(item.id, id);
      itemsToAdd.push({ ...item, id, tagIds: item.tagIds.map((tagId) => tagMap.get(tagId)!), snapshotId: item.snapshotId ? snapshotMap.get(item.snapshotId) : undefined });
      existingKeys.add(key);
    }
    const snapshotsToAdd: Snapshot[] = valid.snapshots.filter((snapshot) => itemMap.has(snapshot.itemId)).map((snapshot) => ({ ...snapshot, id: snapshotMap.get(snapshot.id)!, itemId: itemMap.get(snapshot.itemId)!, cleanHtml: DOMPurify.sanitize(snapshot.cleanHtml) }) as Snapshot);
    const tasksToAdd: PersistentTask[] = valid.tasks.filter((task) => itemMap.has(task.itemId)).map((task) => ({ ...task, lastError: undefined, id: nextId(task.id), itemId: itemMap.get(task.itemId)!, status: task.status === "running" ? "pending" : task.status }) as PersistentTask);
    const viewKeys = new Set(existingViews.map((view) => `${view.name}\0${view.scope}\0${[...view.tagIds].sort().join(",")}`));
    const viewNames = new Set(existingViews.map((view) => view.name));
    const viewsToAdd: SavedView[] = [];
    for (const view of valid.savedViews) {
      if (view.isSystem) continue;
      const mappedTagIds = view.tagIds.map((tagId) => tagMap.get(tagId)!);
      let name = view.name;
      if (name === "新快捷视图") {
        let sequence = 1;
        while (viewNames.has(`${name} ${sequence}`)) sequence += 1;
        name = `${name} ${sequence}`;
      }
      const key = `${name}\0${view.scope}\0${[...mappedTagIds].sort().join(",")}`;
      if (viewKeys.has(key)) continue;
      viewsToAdd.push({ ...view, name, id: nextId(view.id), tagIds: mappedTagIds });
      viewKeys.add(key);
      viewNames.add(name);
    }
    await database.tags.bulkAdd(tagsToAdd);
    await database.savedItems.bulkAdd(itemsToAdd);
    await database.snapshots.bulkAdd(snapshotsToAdd);
    await database.tasks.bulkAdd(tasksToAdd);
    await database.savedViews.bulkAdd(viewsToAdd);
    const counts = new Map<string, number>();
    for (const item of [...existingItems, ...itemsToAdd]) for (const tagId of item.tagIds) counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    for (const tagId of new Set([...existingTags, ...tagsToAdd].map((tag) => tag.id))) await database.tags.update(tagId, { usageCount: counts.get(tagId) ?? 0 });
    return { added: itemsToAdd.length, skipped: items.length - itemsToAdd.length, views: viewsToAdd.length };
  });
}
