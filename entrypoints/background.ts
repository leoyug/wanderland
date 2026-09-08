import { normalizeUrl } from "@/src/capture/normalizeUrl";
import type { CaptureResponse, ExtensionRequest, PageCapture } from "@/src/capture/types";
import { inspirationRepository } from "@/src/db/repository";

function readableError(error: unknown) {
  return error instanceof Error ? error.message : "未知采集错误";
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
    return { capture, ...(await inspirationRepository.completeCapture(itemId, capture)) };
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

export default defineBackground(() => {
  void Promise.all([
    inspirationRepository.initialize(),
    inspirationRepository.recoverInterruptedCaptureTasks(),
  ]).catch((error) => console.error("Wanderland 初始化失败", error));

  browser.runtime.onMessage.addListener((request: ExtensionRequest, sender) => {
    if (request.type === "dashboard:open") {
      const url = new URL(browser.runtime.getURL("/dashboard.html"));
      if (request.itemId) url.searchParams.set("item", request.itemId);
      return browser.tabs.create({ url: url.href });
    }
    if (request.type === "tags:list") return inspirationRepository.listTags();
    if (request.type === "capture:current") return addCurrentPage(request, sender.tab);
    if (request.type === "capture:retry") return retryCurrentPage(request, sender.tab);
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
