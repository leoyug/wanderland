import { pageAnalysisSchema, type AiAnalysisInput, type AiProvider, type PageAnalysis } from "./types";
import { assertSecureAiEndpoint } from "./config";
import type { AppLanguage } from "@/src/i18n/language";

export class AiProviderError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = "AiProviderError";
  }
}

function completionUrl(endpoint: string) {
  const normalized = assertSecureAiEndpoint(endpoint).href.replace(/\/$/, "");
  return normalized.endsWith("/chat/completions") ? normalized : `${normalized}/chat/completions`;
}

function redactSecret(value: string, secret: string) {
  return secret ? value.replaceAll(secret, "[REDACTED]") : value;
}

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse((fenced ?? content).trim()) as unknown;
}

const outputLanguageInstructions: Record<AppLanguage, string> = {
  "zh-CN": "description 必须使用自然、简洁的简体中文，不超过 120 个汉字；产品名、品牌名、技术名等必要专有名词可以保留原文。tags 也优先使用简体中文。",
  "en-US": "description must use concise, natural English and stay within 120 words. Product, brand, and technology names may retain their original spelling. tags should also use English where possible.",
};

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(private readonly options: { endpoint: string; model: string; apiKey: string; outputLanguage?: AppLanguage; timeoutMs?: number; extraBody?: Record<string, unknown> }) {}

  async testConnection(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15_000);
    try {
      const response = await fetch(completionUrl(this.options.endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.options.apiKey}` },
        signal: controller.signal,
        redirect: "error",
        body: JSON.stringify({
          model: this.options.model,
          temperature: 0,
          max_tokens: 1,
          ...this.options.extraBody,
          messages: [{ role: "user", content: "Reply OK." }],
        }),
      });
      if (!response.ok) {
        const detail = redactSecret((await response.text()).slice(0, 240), this.options.apiKey);
        throw new AiProviderError(`Provider 返回 ${response.status}${detail ? `：${detail}` : ""}`, response.status === 408 || response.status === 429 || response.status >= 500);
      }
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new AiProviderError("连接测试超时", true);
      throw new AiProviderError(redactSecret(error instanceof Error ? error.message : "连接测试失败", this.options.apiKey), true);
    } finally {
      clearTimeout(timeout);
    }
  }

  async analyze(input: AiAnalysisInput): Promise<PageAnalysis> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 30_000);
    try {
      const response = await fetch(completionUrl(this.options.endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.options.apiKey}` },
        signal: controller.signal,
        redirect: "error",
        body: JSON.stringify({
          model: this.options.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          max_tokens: 600,
          ...this.options.extraBody,
          messages: [
            {
              role: "system",
              content: `你是个人灵感库的整理助手。无论网页原文使用什么语言，${outputLanguageInstructions[this.options.outputLanguage ?? "zh-CN"]} 标签优先复用已有标签或别名，避免近义词和重复概念。只返回 JSON：{\"description\":\"识别性描述\",\"tags\":[\"3到5个简洁标签\"]}，不要返回 Markdown。`,
            },
            {
              role: "user",
              content: JSON.stringify({
                url: input.url,
                kind: input.kind,
                title: input.title,
                currentDescription: input.currentDescription,
                excerpt: input.pageExcerpt,
                pageText: input.pageText.slice(0, 12_000),
                existingTags: input.existingTags,
              }),
            },
          ],
        }),
      });
      if (!response.ok) {
        const detail = redactSecret((await response.text()).slice(0, 240), this.options.apiKey);
        throw new AiProviderError(`Provider 返回 ${response.status}${detail ? `：${detail}` : ""}`, response.status === 408 || response.status === 429 || response.status >= 500);
      }
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new AiProviderError("Provider 没有返回可解析的内容", false);
      const parsed = pageAnalysisSchema.safeParse(extractJson(content));
      if (!parsed.success) throw new AiProviderError(`AI 输出格式无效：${parsed.error.issues[0]?.message ?? "未知错误"}`, false);
      return { description: parsed.data.description, tags: [...new Set(parsed.data.tags)] };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new AiProviderError("AI 请求超时", true);
      throw new AiProviderError(redactSecret(error instanceof Error ? error.message : "AI 请求失败", this.options.apiKey), true);
    } finally {
      clearTimeout(timeout);
    }
  }
}
