import type { SavedItemKind, SnapshotCompleteness } from "@/src/domain/inspiration";
import type { AiSettings } from "@/src/ai/types";

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
  favicon?: string;
}

export type ExtensionRequest =
  | { type: "dashboard:open"; itemId?: string }
  | { type: "tags:list" }
  | { type: "capture:current"; kind: SavedItemKind; description: string; tags: string[] }
  | { type: "capture:retry"; itemId: string }
  | { type: "ai:config:get" }
  | { type: "ai:config:save"; settings: AiSettings & { apiKey?: string } }
  | { type: "ai:config:test"; settings: AiSettings & { apiKey?: string } }
  | { type: "ai:process" }
  | { type: "ai:retry"; itemId: string }
  | { type: "ai:retry-failed" }
  | { type: "ai:tasks:summary" };

export type CaptureResponse =
  | { ok: true; created: boolean; itemId: string; title: string; completeness: SnapshotCompleteness }
  | { ok: false; itemId?: string; error: string };
