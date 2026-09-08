import type { SavedItemKind, SnapshotCompleteness } from "@/src/domain/inspiration";

export interface PageCapture {
  url: string;
  canonicalUrl?: string;
  title: string;
  description: string;
  siteName?: string;
  byline?: string;
  excerpt?: string;
  cleanText: string;
  cleanHtml: string;
  completeness: SnapshotCompleteness;
  ogImage?: string;
  siteLogo?: string;
  favicon?: string;
}

export type ExtensionRequest =
  | { type: "dashboard:open" }
  | { type: "capture:current"; kind: SavedItemKind; description: string; tags: string[] }
  | { type: "capture:retry"; itemId: string };

export type CaptureResponse =
  | { ok: true; created: boolean; itemId: string; title: string; completeness: SnapshotCompleteness }
  | { ok: false; itemId?: string; error: string };
