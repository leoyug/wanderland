import { normalizeUrl } from "@/src/capture/normalizeUrl";
import { endpointPermissionPattern, getAiSettings, getAiTestCredentials, hardenAiCredentialStorage, saveAiSettings } from "@/src/ai/config";
import { isTrustedAiMessageSender } from "@/src/ai/messageSecurity";
import { OpenAiCompatibleProvider } from "@/src/ai/openAiCompatibleProvider";
import { processAiQueue } from "@/src/ai/runner";
import { readRemoteMetadata } from "@/src/capture/readRemoteMetadata";
import type { CaptureResponse, ExtensionRequest, PageCapture } from "@/src/capture/types";
import { inspirationRepository } from "@/src/db/repository";

function readableError(error: unknown) {
  return error instanceof Error ? error.message : "未知采集错误";
}

function permissionPatternForUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("只支持补全 http:// 或 https:// 网页。");
  return `${url.protocol}//${url.hostname}/*`;
}

async function readLimitedHtml(response: Response, limit = 2_000_000) {
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > limit) throw new Error("网页内容超过 2 MB，已停止补全。");
  if (!response.body) return (await response.text()).slice(0, limit);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let html = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limit) {
      await reader.cancel();
      throw new Error("网页内容超过 2 MB，已停止补全。");
    }
    html += decoder.decode(value, { stream: true });
  }
  return html + decoder.decode();
}

async function getActiveWebTab(candidate?: Browser.tabs.Tab) {
  const tab = candidate ?? (await browser.tabs.query({ active: true, currentWindow: true }))[0];
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    throw new Error("当前页面不支持采集，请打开一个 http:// 或 https:// 网页。");
  }
  return tab;
}

async function readTab(tabId: number) {
  const results = await browser.scripting.executeScript({
    target: { tabId },
    files: ["/capture-page.js"],
  });
  const capture = results[0]?.result as PageCapture | undefined;
  if (!capture?.url) throw new Error("页面采集脚本未返回内容。");
  return capture;
}

async function captureIntoItem(itemId: string, tab: Awaited<ReturnType<typeof getActiveWebTab>>) {
  await inspirationRepository.markCaptureStarted(itemId);
  try {
    const capture = await readTab(tab.id!);
    const completed = { capture, ...(await inspirationRepository.completeCapture(itemId, capture)) };
    void processAiQueue();
    return completed;
  } catch (error) {
    await inspirationRepository.failCapture(itemId, readableError(error));
    throw error;
  }
}

async function addCurrentPage(request: Extract<ExtensionRequest, { type: "capture:current" }>, senderTab?: Browser.tabs.Tab): Promise<CaptureResponse> {
  let itemId: string | undefined;
  try {
    const tab = await getActiveWebTab(senderTab);
    const created = await inspirationRepository.createSavedItem({
      kind: request.kind,
      url: tab.url!,
      title: tab.title,
      description: request.description,
      tags: request.tags,
      captureMethod: "active-tab",
    });
    itemId = created.item.id;
    const completed = await captureIntoItem(itemId, tab);
    return {
      ok: true,
      created: created.created && !completed.mergedDuplicate,
      itemId: completed.itemId,
      title: completed.capture.title || created.item.title,
      completeness: completed.capture.completeness,
    };
  } catch (error) {
    return { ok: false, itemId, error: readableError(error) };
  }
}

async function retryCurrentPage(request: Extract<ExtensionRequest, { type: "capture:retry" }>, senderTab?: Browser.tabs.Tab): Promise<CaptureResponse> {
  let started = false;
  try {
    const [item, tab] = await Promise.all([inspirationRepository.getSavedItem(request.itemId), getActiveWebTab(senderTab)]);
    if (!item) throw new Error("收藏项不存在。");
    const capture = await readTab(tab.id!);
    const currentCandidates = [tab.url!, capture.url, capture.canonicalUrl].filter(Boolean).map((url) => normalizeUrl(url!));
    if (!currentCandidates.includes(item.canonicalUrl)) {
      throw new Error("请先打开该收藏项的来源页面，再重试采集。");
    }
    await inspirationRepository.markCaptureStarted(item.id);
    started = true;
    const completed = await inspirationRepository.completeCapture(item.id, capture);
    return { ok: true, created: false, itemId: completed.itemId, title: capture.title || item.title, completeness: capture.completeness };
  } catch (error) {
    if (started) await inspirationRepository.failCapture(request.itemId, readableError(error));
    return { ok: false, itemId: request.itemId, error: readableError(error) };
  }
}

async function captureRemotePage(
  request: Extract<ExtensionRequest, { type: "capture:remote" }>,
  revokePermission = true,
  captureMethod: "manual-url" | "import" = "manual-url",
): Promise<CaptureResponse> {
  let started = false;
  const expectedPermission = permissionPatternForUrl(request.url);
  try {
    if (request.permissionPattern !== expectedPermission) throw new Error("补全权限范围与目标网站不一致。");
    if (!await browser.permissions.contains({ origins: [expectedPermission] })) throw new Error("未获得该网站的临时访问权限。");
    const item = await inspirationRepository.getSavedItem(request.itemId);
    if (!item || normalizeUrl(request.url) !== item.canonicalUrl) throw new Error("收藏项与补全网址不一致。");

    await inspirationRepository.markCaptureStarted(item.id, captureMethod);
    started = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let capture: PageCapture;
    try {
      const response = await fetch(request.url, { credentials: "omit", cache: "no-store", redirect: "follow", referrerPolicy: "no-referrer", signal: controller.signal });
      if (!response.ok) throw new Error(`网站返回 HTTP ${response.status}，无法补全。`);
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("目标地址没有返回网页内容。");
      capture = readRemoteMetadata(await readLimitedHtml(response), request.url, response.url || request.url);
    } finally {
      clearTimeout(timeout);
    }
    const completed = await inspirationRepository.completeCapture(item.id, capture, captureMethod);
    void processAiQueue();
    return { ok: true, created: false, itemId: completed.itemId, title: capture.title, completeness: capture.completeness };
  } catch (error) {
    if (started) await inspirationRepository.failCapture(request.itemId, readableError(error));
    return { ok: false, itemId: request.itemId, error: readableError(error) };
  } finally {
    if (revokePermission) await browser.permissions.remove({ origins: [expectedPermission] }).catch(() => false);
  }
}

async function captureRemoteBatch(request: Extract<ExtensionRequest, { type: "capture:remote-batch" }>) {
  const permissions = [...new Set(request.items.map((item) => item.permissionPattern))];
  try {
    const results: CaptureResponse[] = [];
    for (const item of request.items) {
      results.push(await captureRemotePage({ type: "capture:remote", ...item }, false, "import"));
    }
    return results;
  } finally {
    if (permissions.length) await browser.permissions.remove({ origins: permissions }).catch(() => false);
  }
}

export default defineBackground(() => {
  void Promise.all([
    hardenAiCredentialStorage(),
    inspirationRepository.initialize(),
    inspirationRepository.recoverInterruptedCaptureTasks(),
    inspirationRepository.recoverInterruptedAiTasks(),
  ]).then(() => processAiQueue()).catch((error) => console.error("Wanderland 初始化失败", error));

  browser.runtime.onMessage.addListener((request: ExtensionRequest, sender) => {
    if (request.type.startsWith("ai:") && !isTrustedAiMessageSender(
      sender,
      browser.runtime.id,
      browser.runtime.getURL("/dashboard.html"),
    )) {
      return Promise.reject(new Error("已拒绝来自非可信扩展页面的 AI 请求。"));
    }
    if ((request.type === "capture:remote" || request.type === "capture:remote-batch") && !isTrustedAiMessageSender(
      sender,
      browser.runtime.id,
      browser.runtime.getURL("/dashboard.html"),
    )) {
      return Promise.reject(new Error("已拒绝来自非可信扩展页面的远程补全请求。"));
    }
    if (request.type === "dashboard:open") {
      const url = new URL(browser.runtime.getURL("/dashboard.html"));
      if (request.itemId) url.searchParams.set("item", request.itemId);
      return browser.tabs.create({ url: url.href });
    }
    if (request.type === "tags:list") return inspirationRepository.listTags();
    if (request.type === "capture:current") return addCurrentPage(request, sender.tab);
    if (request.type === "capture:retry") return retryCurrentPage(request, sender.tab);
    if (request.type === "capture:remote") return captureRemotePage(request);
    if (request.type === "capture:remote-batch") return captureRemoteBatch(request);
    if (request.type === "ai:config:get") return getAiSettings();
    if (request.type === "ai:config:save") {
      return (async () => {
        const previous = await getAiSettings();
        const settings = await saveAiSettings(request.settings);
        try {
          const previousPermission = endpointPermissionPattern(previous.endpoint);
          const nextPermission = endpointPermissionPattern(settings.endpoint);
          if (!settings.enabled || previousPermission !== nextPermission) {
            await browser.permissions.remove({ origins: [previousPermission] });
          }
        } catch {
          // Legacy insecure endpoints are intentionally not retained or requested.
        }
        if (settings.enabled) void processAiQueue();
        return settings;
      })();
    }
    if (request.type === "ai:config:test") {
      return getAiTestCredentials(request.settings).then(({ settings, apiKey }) => new OpenAiCompatibleProvider({
        endpoint: settings.endpoint,
        model: settings.model,
        apiKey,
        timeoutMs: 15_000,
        extraBody: settings.provider === "deepseek" ? { thinking: { type: "disabled" } } : undefined,
      }).testConnection()).then(() => ({ ok: true as const }));
    }
    if (request.type === "ai:process") return processAiQueue().then(() => inspirationRepository.getAiTaskSummary());
    if (request.type === "ai:retry") {
      return inspirationRepository.retryAiTask(request.itemId).then(() => processAiQueue()).then(() => inspirationRepository.getAiTaskSummary());
    }
    if (request.type === "ai:retry-failed") {
      return inspirationRepository.retryFailedAiTasks().then(() => processAiQueue()).then(() => inspirationRepository.getAiTaskSummary());
    }
    if (request.type === "ai:tasks:summary") return inspirationRepository.getAiTaskSummary();
  });

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
      await browser.tabs.create({ url: browser.runtime.getURL("/dashboard.html") });
      return;
    }
    try {
      await browser.scripting.executeScript({ target: { tabId: tab.id }, files: ["/capture-overlay.js"] });
    } catch (error) {
      console.warn("Wanderland 收藏浮层无法在当前页面打开", error);
      await browser.tabs.create({ url: browser.runtime.getURL("/dashboard.html") });
    }
  });
});
