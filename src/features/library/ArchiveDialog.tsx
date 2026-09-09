import { RiCloseLine, RiDeleteBinLine } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { inspirationRepository } from "@/src/db/repository";

function formatArchivedAt(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function ArchiveDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const items = useLiveQuery(
    async () => (await inspirationRepository.listLibraryItems()).filter((item) => item.archivedAt).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)),
    [],
  ) ?? [];
  const [deleteId, setDeleteId] = useState<string>();
  const deleteItem = items.find((item) => item.id === deleteId);

  return (
    <>
      <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
        <Modal className="form-modal settings-modal archive-modal">
          <Dialog className="form-dialog">
            {({ close }) => <>
              <header className="form-dialog-header settings-header"><div><DialogTitle>归档</DialogTitle><p>归档项不会出现在收藏库中，可随时恢复或永久删除。</p></div><Button size="icon" variant="ghost" aria-label="关闭归档" onPress={close}><RiCloseLine size={19} /></Button></header>
              <div className="archive-list">
                {items.length ? items.map((item) => <article className="archive-row" key={item.id}>
                  <div><strong>{item.title}</strong><span>{formatArchivedAt(item.archivedAt!)}</span></div>
                  <div><Button size="icon" variant="dangerGhost" aria-label={`删除 ${item.title}`} onPress={() => setDeleteId(item.id)}><RiDeleteBinLine size={16} /></Button><Button size="sm" variant="secondary" onPress={() => void inspirationRepository.setArchived(item.id, false)}>取消归档</Button></div>
                </article>) : <div className="tag-manager-empty">还没有归档内容。</div>}
              </div>
            </>}
          </Dialog>
        </Modal>
      </ModalOverlay>
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="删除已归档收藏项？"
        description={deleteItem ? `这将永久删除“${deleteItem.title}”，此操作无法撤销。` : ""}
        onClose={() => setDeleteId(undefined)}
        onConfirm={() => deleteItem ? inspirationRepository.deleteSavedItem(deleteItem.id) : undefined}
      />
    </>
  );
}
