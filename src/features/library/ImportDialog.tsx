import { RiArticleLine, RiCloseLine, RiGlobalLine, RiLinksLine, RiUserFollowLine } from "@remixicon/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { Switch } from "@/src/components/ui/Switch";
import type { SavedItemKind } from "@/src/domain/inspiration";

const kindMeta = {
  website: { label: "网站", icon: RiGlobalLine, help: "工具、组件库、灵感站或其他可能会用到的网页。" },
  article: { label: "文章", icon: RiArticleLine, help: "稍后阅读或值得长期保留的单篇内容。" },
  follow: { label: "关注源", icon: RiUserFollowLine, help: "值得持续关注的博主、博客首页或创作者主页。" },
} as const;

interface ImportDialogProps {
  kind: SavedItemKind | null;
  onClose: () => void;
  onAdd: (input: { kind: SavedItemKind; url: string; description: string; enrichMetadata: boolean }) => Promise<boolean>;
  onBulkAdd: (kind: SavedItemKind, urls: string[], enrichMetadata: boolean) => Promise<{ added: number; skipped: number }>;
}

type AddMode = "single" | "multiple";

function parsePastedUrls(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return { urls: [], error: "请至少粘贴一个链接" };

  const urls = new Set<string>();
  for (const [index, line] of lines.entries()) {
    try {
      const parsed = new URL(line);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
      urls.add(parsed.href);
    } catch {
      return { urls: [], error: `第 ${index + 1} 行不是有效的 http:// 或 https:// 链接` };
    }
  }
  return { urls: [...urls], error: "" };
}

export function ImportDialog({ kind, onClose, onAdd, onBulkAdd }: ImportDialogProps) {
  const [mode, setMode] = useState<AddMode>("single");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [enrichMetadata, setEnrichMetadata] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalHeight, setModalHeight] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => { setMode("single"); setUrl(""); setDescription(""); setEnrichMetadata(false); setError(""); setIsSubmitting(false); setModalHeight(null); }, [kind]);
  useLayoutEffect(() => {
    if (!kind || modalHeight !== null) return;
    const height = dialogRef.current?.getBoundingClientRect().height;
    if (height) setModalHeight(Math.ceil(height));
  }, [kind, modalHeight]);
  if (!kind) return null;
  const meta = kindMeta[kind];
  const Icon = meta.icon;

  const submit = async () => {
    if (mode === "multiple") {
      const parsed = parsePastedUrls(url);
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await onBulkAdd(kind, parsed.urls, enrichMetadata);
        if (result.added === 0) {
          setError(`没有新增内容，${result.skipped} 个链接已存在。`);
          return;
        }
        onClose();
      } catch {
        setError("未能写入本地收藏库，请重试。");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
    } catch {
      setError("请输入完整的 http:// 或 https:// 链接");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!await onAdd({ kind, url: parsed.href, description: description.trim(), enrichMetadata })) {
        setError("这个链接已存在于当前内容类型中");
        return;
      }
      onClose();
    } catch {
      setError("未能写入本地收藏库，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal add-item-modal" style={modalHeight ? { height: modalHeight } : undefined}>
        <Dialog ref={dialogRef} className="form-dialog add-item-dialog">
          {({ close }) => <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <header className="form-dialog-header"><div className="form-dialog-icon"><Icon size={20} /></div><div><DialogTitle>添加{meta.label}</DialogTitle><p>{meta.help}</p></div><Button type="button" size="icon" variant="ghost" aria-label="关闭" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className={`form-dialog-body ${mode === "multiple" ? "is-multiple" : ""}`}>
              <div className="import-mode" aria-label="添加方式">
                <button type="button" aria-pressed={mode === "single"} onClick={() => { setMode("single"); setError(""); }}><RiGlobalLine size={15} />单个</button>
                <button type="button" aria-pressed={mode === "multiple"} onClick={() => { setMode("multiple"); setDescription(""); setError(""); }}><RiLinksLine size={15} />多个</button>
              </div>
              {mode === "multiple" ? <><Field className="batch-url-field" label="链接列表" placeholder={`https://example.com\nhttps://another-example.com`} value={url} onChange={setUrl} multiline rows={8} autoFocus /><p className="form-help">每行粘贴一个链接；重复链接会自动跳过。</p></> : <><Field label="链接" placeholder="https://example.com" value={url} onChange={setUrl} autoFocus /><Field label="描述（可选）" placeholder="写下一段便于以后识别的描述" value={description} onChange={setDescription} multiline /><p className="form-help">不填写也可以保存，系统会优先采用网页描述，必要时再由 AI 总结。</p></>}
              <Switch isSelected={enrichMetadata} onChange={setEnrichMetadata} label="补全网站信息" description="添加时临时读取相关网站的标题、描述、favicon 和公开封面；完成后立即撤销访问权限。" />
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <footer className="form-dialog-footer"><Button type="button" variant="ghost" isDisabled={isSubmitting} onPress={close}>取消</Button><Button type="submit" variant="primary" isDisabled={isSubmitting}>{isSubmitting ? "正在添加…" : "添加到收藏库"}</Button></footer>
          </form>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
