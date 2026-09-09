import { RiArticleLine, RiCloseLine, RiGlobalLine, RiUserFollowLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import type { SavedItemKind } from "@/src/domain/inspiration";

const kindMeta = {
  website: { label: "网站", icon: RiGlobalLine, help: "工具、组件库、灵感站或其他可能会用到的网页。" },
  article: { label: "文章", icon: RiArticleLine, help: "稍后阅读或值得长期保留的单篇内容。" },
  follow: { label: "关注源", icon: RiUserFollowLine, help: "值得持续关注的博主、博客首页或创作者主页。" },
} as const;

interface ImportDialogProps {
  kind: SavedItemKind | null;
  onClose: () => void;
  onAdd: (input: { kind: SavedItemKind; url: string; description: string }) => Promise<boolean>;
}

export function ImportDialog({ kind, onClose, onAdd }: ImportDialogProps) {
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setUrl(""); setDescription(""); setError(""); }, [kind]);
  if (!kind) return null;
  const meta = kindMeta[kind];
  const Icon = meta.icon;

  const submit = async () => {
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error();
    } catch {
      setError("请输入完整的 http:// 或 https:// 链接");
      return;
    }

    try {
      if (!await onAdd({ kind, url: parsed.href, description: description.trim() })) {
        setError("这个链接已存在于当前内容类型中");
        return;
      }
      onClose();
    } catch {
      setError("未能写入本地收藏库，请重试。");
    }
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal">
        <Dialog className="form-dialog">
          {({ close }) => <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <header className="form-dialog-header"><div className="form-dialog-icon"><Icon size={20} /></div><div><DialogTitle>添加{meta.label}</DialogTitle><p>{meta.help}</p></div><Button type="button" size="icon" variant="ghost" aria-label="关闭" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="form-dialog-body">
              <Field label="链接" placeholder="https://example.com" value={url} onChange={setUrl} autoFocus />
              <Field label="描述（可选）" placeholder="写下一段便于以后识别的描述" value={description} onChange={setDescription} multiline />
              <p className="form-help">不填写也可以保存，系统会优先采用网页描述，必要时再由 AI 总结。</p>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <footer className="form-dialog-footer"><Button type="button" variant="ghost" onPress={close}>取消</Button><Button type="submit" variant="primary">添加到收藏库</Button></footer>
          </form>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
