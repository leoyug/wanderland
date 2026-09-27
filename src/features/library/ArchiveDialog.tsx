import { RiArchiveLine, RiCloseLine, RiDeleteBinLine } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/src/components/ui/Button";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { inspirationRepository, type DeletedSavedItem } from "@/src/db/repository";
import { t, tf } from "@/src/i18n/ui";
import { formatUiDate } from "@/src/i18n/date";

export function ArchiveDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { showToast, showUndoToast } = useToast();
  const items = useLiveQuery(
    async () => (await inspirationRepository.listLibraryItems()).filter((item) => item.archivedAt).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [],
  ) ?? [];
  const restoreItem = async (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    await inspirationRepository.setArchived(id, false);
    showUndoToast(t("已取消归档"), {
      subject: item?.title,
      onUndo: async () => {
        try {
          await inspirationRepository.setArchived(id, true);
          showToast(t("已恢复归档"), { tone: "success" });
        } catch {
          showToast(t("撤回取消归档失败，请稍后重试"), { tone: "danger" });
        }
      },
    });
  };
  const restoreDeletedItem = async (deleted: DeletedSavedItem) => {
    try {
      const restored = await inspirationRepository.restoreSavedItem(deleted);
      showToast(restored ? t("已撤回删除") : t("撤回失败：收藏项已存在"), { tone: restored ? "success" : "danger" });
    } catch {
      showToast(t("撤回失败，请稍后重试"), { tone: "danger" });
    }
  };
  const deleteArchivedItem = async (id: string) => {
    const deleted = await inspirationRepository.deleteSavedItem(id);
    if (!deleted) return;
    showUndoToast(t("已删除收藏项"), { subject: deleted.item.title, onUndo: () => restoreDeletedItem(deleted) });
  };

  return (
    <>
      <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
        <Modal className="form-modal settings-modal archive-modal">
          <Dialog className="form-dialog">
            {({ close }) => <>
              <header className="form-dialog-header settings-header"><div className="form-dialog-icon"><RiArchiveLine size={20} /></div><div><DialogTitle>{t("归档")}</DialogTitle><p>{t("归档项不会出现在收藏库中，可随时恢复或永久删除。")}</p></div><Button size="icon" variant="ghost" aria-label={t("关闭归档")} onPress={close}><RiCloseLine size={19} /></Button></header>
              <div className="archive-list">
                {items.length ? items.map((item) => <article className="archive-row" key={item.id}>
                  <div><strong>{item.title}</strong><span>{formatUiDate(item.archivedAt!, true)}</span></div>
                  <div><Button size="icon" variant="dangerGhost" aria-label={tf("删除 {name}", { name: item.title })} onPress={() => void deleteArchivedItem(item.id)}><RiDeleteBinLine size={16} /></Button><Button size="sm" variant="secondary" onPress={() => void restoreItem(item.id)}>{t("取消归档")}</Button></div>
                </article>) : <div className="tag-manager-empty">{t("还没有归档内容。")}</div>}
              </div>
            </>}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
