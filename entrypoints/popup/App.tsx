import { RiArticleLine, RiArrowRightLine, RiCheckLine, RiGlobalLine, RiRefreshLine, RiUserFollowLine } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { TagInput } from "@/src/components/ui/TagInput";
import type { CaptureResponse, ExtensionRequest } from "@/src/capture/types";
import { inspirationRepository } from "@/src/db/repository";
import type { SavedItemKind } from "@/src/domain/inspiration";

const kindOptions = [
  { id: "website", label: "网站", icon: RiGlobalLine },
  { id: "article", label: "文章", icon: RiArticleLine },
  { id: "follow", label: "关注源", icon: RiUserFollowLine },
] as const;

type PageState = { title: string; url: string; supported: boolean };
type SubmitState = "ready" | "saving" | "success" | "error";

export function PopupApp() {
  const [page, setPage] = useState<PageState>();
  const [kind, setKind] = useState<SavedItemKind>("website");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [state, setState] = useState<SubmitState>("ready");
  const [result, setResult] = useState<CaptureResponse>();
  const availableTags = useLiveQuery(() => inspirationRepository.listTags(), []) ?? [];

  useEffect(() => {
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      const url = tab?.url ?? "";
      setPage({ title: tab?.title || "当前页面", url, supported: /^https?:/.test(url) });
    });
  }, []);

  const submit = async () => {
    if (!page?.supported || state === "saving") return;
    setState("saving");
    const response = await browser.runtime.sendMessage({ type: "capture:current", kind, description, tags: selectedTags } satisfies ExtensionRequest) as CaptureResponse;
    setResult(response);
    setState(response.ok ? "success" : "error");
  };

  const retry = async () => {
    if (!result || result.ok || !result.itemId) return;
    setState("saving");
    const response = await browser.runtime.sendMessage({ type: "capture:retry", itemId: result.itemId } satisfies ExtensionRequest) as CaptureResponse;
    setResult(response);
    setState(response.ok ? "success" : "error");
  };

  const openDashboard = async () => {
    await browser.runtime.sendMessage({ type: "dashboard:open" } satisfies ExtensionRequest);
    window.close();
  };

  const statusText = result?.ok
    ? result.created
      ? "收藏项已保存"
      : "收藏项已存在，快照已更新"
    : result?.error;

  return (
    <main className={`popup-shell${state === "success" ? " is-success" : ""}`}>
      <header className="popup-header">
        <div className="popup-brand"><img src="/assets/logo.svg" alt="" /><span>Wanderland</span></div>
        <button type="button" className="popup-library-link" onClick={() => void openDashboard()}>打开收藏库<RiArrowRightLine size={15} /></button>
      </header>

      <section className="popup-page" aria-busy={!page}>
        <span>{page?.supported === false ? "当前页面不支持添加" : "当前页面"}</span>
        <strong>{page?.title ?? "正在读取…"}</strong>
        {page?.url ? <small title={page.url}>{page.url}</small> : null}
      </section>

      {state === "success" ? (
        <section className="popup-result" aria-live="polite">
          <div className="popup-result-icon"><RiCheckLine size={20} /></div>
          <div><strong>{statusText}</strong><p>{result?.ok && result.completeness === "complete" ? "标题、描述与正文快照已保存。" : "页面基本信息已保存，快照可能不完整。"}</p></div>
        </section>
      ) : (
        <>
          <div className="popup-kinds" role="group" aria-label="内容类型">
            {kindOptions.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={kind === id} onClick={() => setKind(id)}><Icon size={16} /><span>{label}</span></button>)}
          </div>
          <label className="popup-description">
            <span>描述（可选）</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="不填写时，优先使用网页描述" rows={3} />
          </label>
          <TagInput
            label="标签（可选）"
            tags={selectedTags}
            options={availableTags}
            onChange={setSelectedTags}
            placement="bottom"
          />
          {state === "error" ? <div className="popup-error" role="alert"><p>{statusText}</p>{result && !result.ok && result.itemId ? <Button variant="secondary" size="sm" onPress={() => void retry()}><RiRefreshLine size={15} />重试采集</Button> : null}</div> : null}
        </>
      )}

      <footer className="popup-footer">
        {state === "success" ? <Button variant="primary" onPress={() => void openDashboard()}>查看收藏项</Button> : <Button variant="primary" isDisabled={!page?.supported || state === "saving"} onPress={() => void submit()}>{state === "saving" ? "正在保存与采集…" : "添加当前页"}</Button>}
      </footer>
    </main>
  );
}
