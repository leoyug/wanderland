import { RiCloseLine, RiFileMarkedLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { Switch } from "@/src/components/ui/Switch";

interface DataImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (urls: string[], enrichMetadata: boolean) => Promise<{ added: number; skipped: number }>;
}

function extractBookmarkUrls(value: string) {
  const candidates = [...new DOMParser().parseFromString(value, "text/html").querySelectorAll<HTMLAnchorElement>("a[href]")].map((anchor) => anchor.href);

  const unique = new Set<string>();
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate.trim());
      if (/^https?:$/.test(parsed.protocol)) unique.add(parsed.href);
    } catch {
      // Invalid fragments are ignored; the form reports when no usable URL remains.
    }
  }
  return [...unique];
}

export function DataImportDialog({ isOpen, onClose, onImport }: DataImportDialogProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [enrichMetadata, setEnrichMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setValue(""); setError(""); setEnrichMetadata(false); setIsSubmitting(false); }
  }, [isOpen]);

  const submit = async () => {
    const urls = extractBookmarkUrls(value);
    if (urls.length === 0) {
      setError("书签 HTML 中没有找到可导入的链接");
      return;
    }
    let result: { added: number; skipped: number };
    setIsSubmitting(true);
    try {
      result = await onImport(urls, enrichMetadata);
    } catch {
      setError("导入未能写入本地收藏库，请重试。");
      return;
    } finally {
      setIsSubmitting(false);
    }
    if (result.added === 0) {
      setError(`没有新增内容，${result.skipped} 个链接已存在。`);
      return;
    }
    onClose();
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal import-modal">
        <Dialog className="form-dialog">
          {({ close }) => <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
            <header className="form-dialog-header"><div className="form-dialog-icon"><RiFileMarkedLine size={20} /></div><div><DialogTitle>导入浏览器书签</DialogTitle><p>导入后先保存链接，描述与标签可在后台逐步补全。</p></div><Button type="button" size="icon" variant="ghost" aria-label="关闭导入" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="form-dialog-body">
              <Field className="batch-url-field" label="书签 HTML 内容" placeholder="粘贴浏览器导出的书签 HTML 内容" value={value} onChange={setValue} multiline rows={8} autoFocus />
              <p className="form-help">书签会作为“网站”保存，已存在的规范化链接会自动跳过。</p>
              <Switch isSelected={enrichMetadata} onChange={setEnrichMetadata} label="补全网站信息与封面" description="浏览器将一次确认本批次涉及的网站；只读取标题、描述、favicon 和公开 OG 封面，完成后立即撤销全部访问权限。" />
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <footer className="form-dialog-footer"><Button type="button" variant="ghost" isDisabled={isSubmitting} onPress={close}>取消</Button><Button type="submit" variant="primary" isDisabled={isSubmitting}>{isSubmitting ? "正在导入…" : "开始导入"}</Button></footer>
          </form>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
