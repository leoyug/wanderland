import Dexie, { type EntityTable } from "dexie";
import type { PersistentTask, SavedItem, SavedView, Snapshot, Tag } from "@/src/domain/inspiration";

export const DATABASE_NAME = "wanderland";

export class WanderlandDatabase extends Dexie {
  savedItems!: EntityTable<SavedItem, "id">;
  snapshots!: EntityTable<Snapshot, "id">;
  tags!: EntityTable<Tag, "id">;
  savedViews!: EntityTable<SavedView, "id">;
  tasks!: EntityTable<PersistentTask, "id">;

  constructor(name = DATABASE_NAME) {
    super(name);

    this.version(1).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,aiStatus,createdAt,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt",
    });

    this.version(2).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    }).upgrade(async (transaction) => {
      const now = Date.now();
      await transaction.table("savedItems").toCollection().modify((item) => {
        item.tagIds ??= [];
        item.createdAt ??= now;
        item.updatedAt ??= item.createdAt;
        item.snapshotStatus ??= "pending";
      });
      await transaction.table("savedViews").toCollection().modify((view) => {
        view.isSystem ??= false;
        view.tagIds ??= [];
        view.sortOrder ??= 0;
        view.createdAt ??= now;
        view.updatedAt ??= view.createdAt;
      });
    });

    this.version(3).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    }).upgrade(async (transaction) => {
      const now = Date.now();
      const savedItems = await transaction.table<SavedItem, string>("savedItems").toArray();
      const tasks = transaction.table<PersistentTask, string>("tasks");
      const existingAiItemIds = new Set(
        (await tasks.where("type").equals("ai").toArray()).map((task) => task.itemId),
      );
      const missingTasks = savedItems
        .filter((item) => item.aiStatus !== "complete" && !existingAiItemIds.has(item.id))
        .map((item) => ({
          id: `task-ai-migration-${item.id}`,
          itemId: item.id,
          type: "ai" as const,
          status: "pending" as const,
          attempts: 0,
          createdAt: now,
          updatedAt: now,
        }));
      if (missingTasks.length) await tasks.bulkAdd(missingTasks);
    });

    this.version(4).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,archivedAt,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    });

    this.version(5).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,archivedAt,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    }).upgrade(async (transaction) => {
      await transaction.table<Tag, string>("tags").toCollection().modify((tag) => {
        tag.normalizedName = tag.name.trim().replace(/^#/, "").normalize("NFKC");
      });
    });

    this.version(6).stores({
      savedItems: "id,&[kind+canonicalUrl],canonicalUrl,kind,isFavorite,archivedAt,aiStatus,snapshotStatus,createdAt,updatedAt,*tagIds",
      snapshots: "id,&itemId,capturedAt,completeness",
      tags: "id,&normalizedName,usageCount,updatedAt",
      savedViews: "id,isSystem,sortOrder,updatedAt,*tagIds",
      tasks: "id,itemId,type,status,updatedAt,[status+updatedAt]",
    }).upgrade(async (transaction) => {
      const table = transaction.table<SavedView, string>("savedViews");
      const views = await table.toArray();
      const defaults = views.filter((view) => view.name === "新快捷视图").sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
      const names = new Set(views.filter((view) => view.name !== "新快捷视图").map((view) => view.name));
      let sequence = 1;
      for (const view of defaults) {
        while (names.has(`新快捷视图 ${sequence}`)) sequence += 1;
        const name = `新快捷视图 ${sequence++}`;
        await table.update(view.id, { name });
        names.add(name);
      }
    });
  }
}

export const db = new WanderlandDatabase();
