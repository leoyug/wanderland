export type AiStatus = "complete" | "pending" | "failed";
export type SavedItemKind = "website" | "article" | "follow";
export type LibraryScope = "all" | "unprocessed" | "favorites" | SavedItemKind;
export type DescriptionSource = "user" | "page" | "ai";

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

export interface SavedItem {
  id: string;
  kind: SavedItemKind;
  title: string;
  siteHost: string;
  description: string;
  descriptionSource?: DescriptionSource;
  url: string;
  tags: string[];
  savedAt: string;
  aiStatus: AiStatus;
  isFavorite: boolean;
  cover: {
    background: string;
    foreground: string;
    label: string;
    motif: "type" | "grid" | "orb";
    image?: string;
  };
  siteIcon?: string;
}

export interface SavedView {
  id: string;
  name: string;
  isSystem?: boolean;
  scope: LibraryScope;
  tags?: string[];
}
