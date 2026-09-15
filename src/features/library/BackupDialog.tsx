import { RiCloseLine, RiDownloadLine, RiShieldCheckLine, RiUploadLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { createBackup, parseBackup, restoreBackup, type Backup } from "@/src/db/backup";

const MAX_BACKUP_BYTES = 100 * 1024 * 1024;

export function BackupDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<{ name: string; backup: Backup }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    if (isOpen) { setSelected(undefined); setError(""); setResult(""); setBusy(false); }
  }, [isOpen]);

  const exportFile = async () => {
    setBusy(true); setError(""); setResult("");
    try {
      const backup = await createBackup();
      const file = new Blob([JSON.stringify(backup)], { type: "application/json" });
      if (file.size > MAX_BACKUP_BYTES) throw new Error("备份超过 100 MB，当前版本无法安全处理；未下载不可恢复的文件。");
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `wanderland-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setResult(`已准备下载：${backup.savedItems.length} 个收藏项，含标签、快照、封面和快捷视图。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出失败，未生成备份文件。请检查浏览器存储空间后重试。");
    } finally { setBusy(false); }
  };

  const chooseFile = async (file?: File) => {
    setSelected(undefined); setError(""); setResult("");
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setError("备份文件超过 100 MB，未读取。请先检查文件来源。"); return; }
    setBusy(true);
    try {
      const backup = parseBackup(JSON.parse(await file.text()) as unknown);
      setSelected({ name: file.name, backup });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取备份文件。");
    } finally { setBusy(false); }
  };

  const restore = async () => {
    if (!selected) return;
    setBusy(true); setError(""); setResult("");
    try {
      const outcome = await restoreBackup(selected.backup);
      setResult(`恢复完成：新增 ${outcome.added} 个收藏项，跳过 ${outcome.skipped} 个已有项，新增 ${outcome.views} 个快捷视图。`);
      setSelected(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "恢复失败；数据库事务已回滚，原有数据未删除。");
    } finally { setBusy(false); }
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable={!busy} onOpenChange={(open) => !open && !busy && onClose()}>
      <Modal className="form-modal settings-modal backup-modal">
        <Dialog className="form-dialog">
          {({ close }) => <>
            <header className="form-dialog-header settings-header"><div className="form-dialog-icon"><RiShieldCheckLine size={20} /></div><div><DialogTitle>数据备份与恢复</DialogTitle><p>将本地收藏库保存为文件，或从先前的备份补回内容。</p></div><Button size="icon" variant="ghost" aria-label="关闭数据备份与恢复" isDisabled={busy} onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="form-dialog-body backup-body">
              <section className="backup-section"><div className="backup-section-heading"><RiDownloadLine size={18} /><div><h3>导出完整收藏库</h3><p>包含收藏项、归档项、标签、正文快照、封面图片、快捷视图和待处理任务。</p></div></div><Button variant="secondary" isDisabled={busy} onPress={() => void exportFile()}>下载备份文件</Button></section>
              <section className="backup-section"><div className="backup-section-heading"><RiUploadLine size={18} /><div><h3>从备份恢复</h3><p>只补入缺少的收藏项，不覆盖或删除当前内容；相同类型和网址的项目会跳过。</p></div></div><label className="button button-secondary button-md backup-file-label">选择 JSON 备份<input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { void chooseFile(event.target.files?.[0]); event.target.value = ""; }} /></label>{selected ? <div className="backup-preview"><strong>{selected.name}</strong><span>{selected.backup.savedItems.length} 个收藏项 · {selected.backup.snapshots.length} 份快照 · {selected.backup.tags.length} 个标签</span><Button variant="primary" isDisabled={busy} onPress={() => void restore()}>确认合并恢复</Button></div> : null}</section>
              <p className="backup-privacy"><RiShieldCheckLine size={17} aria-hidden="true" />备份文件保存在你选择的位置，包含私人收藏与网页正文；不包含 AI API Key。AI Provider 设置保持当前浏览器原样，迁移到新浏览器时需重新配置。</p>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {result ? <p className="form-success" role="status">{result}</p> : null}
            </div>
          </>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
