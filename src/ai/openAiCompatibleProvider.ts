import { pageAnalysisSchema, type AiAnalysisInput, type AiProvider, type PageAnalysis } from "./types";
import { assertSecureAiEndpoint } from "./config";

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

export class OpenAiCompatibleProvider implements AiProvider {
  constructor(private readonly options: { endpoint: string; model: string; apiKey: string; timeoutMs?: number; extraBody?: Record<string, unknown> }) {}

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
              content: "你是个人灵感库的整理助手。只返回 JSON：{\"description\":\"不超过120个汉字的识别性描述\",\"tags\":[\"3到5个简洁标签\"]}。标签优先复用已有标签或别名，避免近义词和重复概念。不要返回 Markdown。",
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
