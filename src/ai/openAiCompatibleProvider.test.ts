import { afterEach, describe, expect, it, vi } from "vitest";
import { AiProviderError, OpenAiCompatibleProvider } from "./openAiCompatibleProvider";

const input = {
  url: "https://example.com/article",
  kind: "article" as const,
  title: "Article",
  currentDescription: "",
  pageExcerpt: "Excerpt",
  pageText: "Text",
  existingTags: [{ name: "设计", aliases: ["design"] }],
};

afterEach(() => vi.unstubAllGlobals());

describe("OpenAiCompatibleProvider", () => {
  it("tests connectivity with a minimal request without requiring structured output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: "OK" } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.testConnection()).resolves.toBeUndefined();
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ model: "test", max_tokens: 1, messages: [{ role: "user", content: "Reply OK." }] });
    expect(body).not.toHaveProperty("response_format");
  });

  it("accepts a valid structured response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"一篇设计文章\",\"tags\":[\"设计\",\"排版\",\"前端\"]}" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", extraBody: { thinking: { type: "disabled" } } });

    await expect(provider.analyze(input)).resolves.toEqual({ description: "一篇设计文章", tags: ["设计", "排版", "前端"] });
    expect(fetch).toHaveBeenCalledWith("https://api.example.com/v1/chat/completions", expect.objectContaining({ method: "POST" }));
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ redirect: "error" });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ thinking: { type: "disabled" }, max_tokens: 600 });
    expect(body.messages[0].content).toContain("description 必须使用自然、简洁的简体中文");
  });

  it("uses the selected app language for generated descriptions and tags", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"A design article\",\"tags\":[\"Design\",\"Typography\",\"Frontend\"]}" } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", outputLanguage: "en-US" });

    await provider.analyze(input);

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body as string);
    expect(body.messages[0].content).toContain("description must use concise, natural English");
  });

  it("rejects invalid JSON and duplicate tags as non-retryable output errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: "{\"description\":\"x\",\"tags\":[\"设计\",\"设计\",\"前端\"]}" } }],
    }), { status: 200 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: false });
  });

  it("marks provider throttling as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: true });
  });

  it("redacts the API key if a provider echoes it in an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid key: real-secret", { status: 401 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "real-secret" });

    await expect(provider.analyze(input)).rejects.toMatchObject({ message: "Provider 返回 401：invalid key: [REDACTED]" });
  });

  it("redacts the API key from connection-test errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("invalid key: real-secret", { status: 401 })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "real-secret" });

    await expect(provider.testConnection()).rejects.toMatchObject({ message: "Provider 返回 401：invalid key: [REDACTED]" });
  });

  it("aborts timed out requests without accepting partial output", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const provider = new OpenAiCompatibleProvider({ endpoint: "https://api.example.com/v1", model: "test", apiKey: "secret", timeoutMs: 5 });

    await expect(provider.analyze(input)).rejects.toMatchObject<Partial<AiProviderError>>({ retryable: true, message: "AI 请求超时" });
  });
});
