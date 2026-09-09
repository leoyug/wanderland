import { z } from "zod";
import type { SavedItemKind } from "@/src/domain/inspiration";

export const pageAnalysisSchema = z.object({
  description: z.string().trim().max(320),
  tags: z.array(z.string().trim().min(1).max(32)).min(3).max(5).refine(
    (tags) => new Set(tags.map((tag) => tag.normalize("NFKC").toLocaleLowerCase("zh-CN"))).size === tags.length,
    "标签不能重复",
  ),
});

export type PageAnalysis = z.infer<typeof pageAnalysisSchema>;

export interface AiAnalysisInput {
  url: string;
  kind: SavedItemKind;
  title: string;
  currentDescription: string;
  pageExcerpt: string;
  pageText: string;
  existingTags: Array<{ name: string; aliases: string[] }>;
}

export interface AiProvider {
  analyze(input: AiAnalysisInput): Promise<PageAnalysis>;
}

export type ApiKeyStorage = "local" | "session";
export type AiProviderId = "openai" | "deepseek" | "custom";

export interface AiSettings {
  enabled: boolean;
  provider: AiProviderId;
  endpoint: string;
  model: string;
  apiKeyStorage: ApiKeyStorage;
}

export interface AiSettingsView extends AiSettings {
  hasApiKey: boolean;
}

export interface AiTaskSummary {
  pending: number;
  running: number;
  failed: number;
  complete: number;
}
