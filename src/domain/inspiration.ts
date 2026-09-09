export type AiStatus = "complete" | "pending" | "failed";
export type SavedItemKind = "website" | "article" | "follow";
export type LibraryScope = "all" | "unprocessed" | "favorites" | SavedItemKind;
export type DescriptionSource = "user" | "page" | "ai";
export type SnapshotStatus = "pending" | "complete" | "partial" | "failed";
export type SnapshotCompleteness = "complete" | "partial" | "failed";
export type CaptureMethod = "active-tab" | "manual-url" | "import";
export type TaskType = "capture" | "ai";
export type TaskStatus = "pending" | "running" | "failed" | "complete";

export interface DescriptionValue {
  description: string;
  descriptionSource?: DescriptionSource;
}

const descriptionPriority: Record<DescriptionSource, number> = { user: 3, page: 2, ai: 1 };

export function resolveDescription(current: DescriptionValue, candidate: { description: string; source: DescriptionSource }): DescriptionValue {
  const description = candidate.description.trim();
  if (!description) return current;

  const currentPriority = current.descriptionSource
    ? descriptionPriority[current.descriptionSource]
    : current.description.trim() ? descriptionPriority.page : 0;

  return descriptionPriority[candidate.source] >= currentPriority
    ? { description, descriptionSource: candidate.source }
    : current;
}

export interface CoverData {
  background: string;
  foreground: string;
  label: string;
  motif: "type" | "grid" | "orb";
  image?: string;
  blob?: Blob;
  width?: number;
  height?: number;
  isUserSelected?: boolean;
}

/** The durable SavedItem shape stored in IndexedDB. */
export interface SavedItem {
  id: string;
  originalUrl: string;
  canonicalUrl: string;
  siteHost: string;
  title: string;
  description: string;
  descriptionSource?: DescriptionSource;
  cover: CoverData;
  kind: SavedItemKind;
  tagIds: string[];
  isFavorite: boolean;
  archivedAt?: number;
  snapshotId?: string;
  snapshotStatus: SnapshotStatus;
  aiStatus: AiStatus;
  /** Once present, later AI runs must not add, remove, or replace tags. */
  tagsEditedAt?: number;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  siteIcon?: string;
}

export interface Snapshot {
  id: string;
  itemId: string;
  capturedAt: number;
  title: string;
  byline?: string;
  excerpt?: string;
  cleanText: string;
  cleanHtml: string;
  captureMethod: CaptureMethod;
  completeness: SnapshotCompleteness;
  error?: string;
}

export interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  usageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavedView {
  id: string;
  name: string;
  isSystem: boolean;
  scope: LibraryScope;
  tagIds: string[];
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface PersistentTask {
  id: string;
  itemId: string;
  type: TaskType;
  status: TaskStatus;
  attempts: number;
  captureMethod?: CaptureMethod;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
  nextAttemptAt?: number;
}

/** A read model for the Dashboard. Business writes still use ids and repository methods. */
export interface LibraryItem extends SavedItem {
  url: string;
  sourceLabel: string;
  tags: string[];
  savedAt: string;
  snapshotText: string;
  aiError?: string;
  aiAttempts?: number;
}

export interface UpdateSavedItemInput {
  title: string;
  description: string;
  tags: string[];
  coverBlob?: Blob;
  descriptionEdited?: boolean;
}

export interface LibrarySavedView extends SavedView {
  tags: string[];
}

export interface CreateSavedItemInput {
  kind: SavedItemKind;
  url: string;
  description?: string;
  tags?: string[];
  title?: string;
  captureMethod?: CaptureMethod;
}

export function isSavedItemProcessed(item: Pick<SavedItem, "descriptionSource" | "tagIds">) {
  return item.descriptionSource === "user" || item.tagIds.length > 0;
}
