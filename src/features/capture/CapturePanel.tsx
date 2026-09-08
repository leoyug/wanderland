import {
  RiArticleLine,
  RiCheckLine,
  RiCloseLine,
  RiGlobalLine,
  RiRefreshLine,
  RiUserFollowLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { Field } from "@/src/components/ui/Field";
import { TagInput } from "@/src/components/ui/TagInput";
import type { CaptureResponse, ExtensionRequest } from "@/src/capture/types";
import type { SavedItemKind, Tag } from "@/src/domain/inspiration";

const kindOptions = [
  { id: "website", label: "网站", icon: RiGlobalLine },
  { id: "article", label: "文章", icon: RiArticleLine },
  { id: "follow", label: "关注源", icon: RiUserFollowLine },
] as const;

type SubmitState = "ready" | "saving" | "success" | "error";

const messageError = (error: unknown): CaptureResponse => ({
  ok: false,
  error: error instanceof Error ? error.message : "扩展通信失败，请刷新当前页面后重试。",
});

interface CapturePanelProps {
  page: { title: string; url: string };
  onClose: () => void;
}

export function CapturePanel({ page, onClose }: CapturePanelProps) {
  const [kind, setKind] = useState<SavedItemKind>("website");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [state, setState] = useState<SubmitState>("ready");
  const [result, setResult] = useState<CaptureResponse>();

  useEffect(() => {
    void browser.runtime.sendMessage({ type: "tags:list" } satisfies ExtensionRequest)
      .then((tags) => setAvailableTags(tags as Tag[]))
      .catch(() => setAvailableTags([]));
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const submit = async () => {
    if (state === "saving") return;
    setState("saving");
    let response: CaptureResponse;
    try {
      response = await browser.runtime.sendMessage({
        type: "capture:current",
        kind,
        description,
        tags: selectedTags,
      } satisfies ExtensionRequest) as CaptureResponse;
    } catch (error) {
      response = messageError(error);
    }
    setResult(response);
    setState(response.ok ? "success" : "error");
  };

  const retry = async () => {
    if (!result || result.ok || !result.itemId) return;
    setState("saving");
    let response: CaptureResponse;
    try {
      response = await browser.runtime.sendMessage({
        type: "capture:retry",
        itemId: result.itemId,
      } satisfies ExtensionRequest) as CaptureResponse;
    } catch (error) {
      response = messageError(error);
    }
    setResult(response);
    setState(response.ok ? "success" : "error");
  };

  const openDashboard = async () => {
    await browser.runtime.sendMessage({
      type: "dashboard:open",
      itemId: result?.ok ? result.itemId : undefined,
    } satisfies ExtensionRequest);
    onClose();
  };

  const statusText = result?.ok
    ? result.created ? "收藏项已保存" : "收藏项已存在，快照已更新"
    : result?.error;

  return (
    <section className={`capture-panel${state === "success" ? " is-success" : ""}`} role="dialog" aria-modal="false" aria-label="收藏当前页面">
      <header className="capture-header">
        <div className="capture-brand">
          <img src={browser.runtime.getURL("/assets/logo.svg")} alt="" />
          <span>Wanderland</span>
        </div>
        <div className="capture-header-actions">
          <button type="button" className="capture-library-link" onClick={() => void openDashboard()}>打开收藏库</button>
          <button type="button" className="capture-close" onClick={onClose} aria-label="关闭收藏面板" autoFocus><RiCloseLine size={19} /></button>
        </div>
      </header>

      <section className="capture-page">
        <span>当前页面</span>
        <strong>{page.title || "当前页面"}</strong>
        <small title={page.url}>{page.url}</small>
      </section>

      {state === "success" ? (
        <section className="capture-result" aria-live="polite">
          <div className="capture-result-icon"><RiCheckLine size={20} /></div>
          <div><strong>{statusText}</strong><p>{result?.ok && result.completeness === "complete" ? "标题、描述与正文快照已保存。" : "页面基本信息已保存，快照可能不完整。"}</p></div>
        </section>
      ) : (
        <>
          <div className="capture-kinds" role="group" aria-label="内容类型">
            {kindOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}><Icon size={16} /><span>{label}</span></button>)}
          </div>
          <Field className="capture-description" label="描述（可选）" value={description} onChange={setDescription} placeholder="不填写时，优先使用网页描述" multiline rows={3} />
          <TagInput label="标签（可选）" tags={selectedTags} options={availableTags} onChange={setSelectedTags} placement="bottom" />
          {state === "error" ? <div className="capture-error" role="alert"><p>{statusText}</p>{result && !result.ok && result.itemId ? <button type="button" className="button button-secondary button-sm" onClick={() => void retry()}><RiRefreshLine size={15} />重试采集</button> : null}</div> : null}
        </>
      )}

      <footer className="capture-footer">
        {state === "success"
          ? <button type="button" className="button button-primary button-md" onClick={() => void openDashboard()}>查看收藏项</button>
          : <button type="button" className="button button-primary button-md" disabled={state === "saving"} onClick={() => void submit()}>{state === "saving" ? "正在保存与采集…" : "添加当前页"}</button>}
      </footer>
    </section>
  );
}
