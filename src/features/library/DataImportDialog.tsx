import { RiCloseLine, RiFileTextLine, RiLinksLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";

type ImportMode = "urls" | "bookmarks";

interface DataImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (urls: string[]) => Promise<{ added: number; skipped: number }>;
}

function extractUrls(value: string, mode: ImportMode) {
  const candidates = mode === "bookmarks"
    ? [...new DOMParser().parseFromString(value, "text/html").querySelectorAll<HTMLAnchorElement>("a[href]")].map((anchor) => anchor.href)
    : value.split(/[\n,\s]+/);

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
  const [mode, setMode] = useState<ImportMode>("urls");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setMode("urls"); setValue(""); setError(""); }
  }, [isOpen]);

  const submit = async () => {
    const urls = extractUrls(value, mode);
    if (urls.length === 0) {
      setError(mode === "urls" ? "没有找到有效的 http:// 或 https:// 链接" : "书签 HTML 中没有找到可导入的链接");
      return;
    }
    let result: { added: number; skipped: number };
    try {
      result = await onImport(urls);
    } catch {
      setError("导入未能写入本地收藏库，请重试。");
      return;
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
            <header className="form-dialog-header"><div className="form-dialog-icon"><RiLinksLine size={20} /></div><div><Heading slot="title">导入收藏项</Heading><p>导入后先保存链接，描述与标签可在后台逐步补全。</p></div><Button type="button" size="icon" variant="ghost" aria-label="关闭导入" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="form-dialog-body">
              <div className="import-mode" aria-label="导入方式">
                <button type="button" aria-pressed={mode === "urls"} onClick={() => { setMode("urls"); setError(""); }}><RiLinksLine size={15} />批量链接</button>
                <button type="button" aria-pressed={mode === "bookmarks"} onClick={() => { setMode("bookmarks"); setError(""); }}><RiFileTextLine size={15} />书签 HTML</button>
              </div>
              <Field label={mode === "urls" ? "链接列表" : "书签 HTML 内容"} placeholder={mode === "urls" ? "每行粘贴一个链接" : "粘贴浏览器导出的书签 HTML 内容"} value={value} onChange={setValue} multiline autoFocus />
              <p className="form-help">批量导入默认归入“网站”，已存在的规范化链接会自动跳过。</p>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <footer className="form-dialog-footer"><Button type="button" variant="ghost" onPress={close}>取消</Button><Button type="submit" variant="primary">开始导入</Button></footer>
          </form>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
