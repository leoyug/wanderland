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
  }
}

export const db = new WanderlandDatabase();
