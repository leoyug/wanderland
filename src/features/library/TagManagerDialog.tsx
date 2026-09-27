import { RiCloseLine, RiDeleteBinLine, RiEditLine, RiPriceTag3Line } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { inspirationRepository } from "@/src/db/repository";
import { t, tf } from "@/src/i18n/ui";

export function TagManagerDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const tags = useLiveQuery(() => inspirationRepository.listTags(), []) ?? [];
  const [editingId, setEditingId] = useState<string>();
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string>();

  const save = async (id: string) => {
    await inspirationRepository.renameTag(id, name);
    setEditingId(undefined);
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal settings-modal">
        <Dialog className="form-dialog">
          {({ close }) => <>
            <header className="form-dialog-header settings-header"><div className="form-dialog-icon"><RiPriceTag3Line size={20} /></div><div><DialogTitle>{t("管理标签")}</DialogTitle><p>{t("重命名为已有标签会自动合并，并保留原名称作为别名。")}</p></div><Button size="icon" variant="ghost" aria-label={t("关闭标签管理")} onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="tag-manager-list">
              {tags.length ? tags.map((tag) => <div className="tag-manager-row" key={tag.id}>
                {editingId === tag.id ? <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void save(tag.id); if (event.key === "Escape") setEditingId(undefined); }} aria-label={tf("重命名 {name}", { name: tag.name })} /> : <div><strong>{tag.name}</strong><span>{tag.usageCount}{t(" 个收藏项")}{tag.aliases.length ? tf(" · 别名 {names}", { names: tag.aliases.join("、") }) : ""}</span></div>}
                <div>{editingId === tag.id ? <Button size="sm" variant="primary" onPress={() => void save(tag.id)}>{t("保存")}</Button> : <Button size="icon" variant="ghost" aria-label={tf("重命名 {name}", { name: tag.name })} onPress={() => { setEditingId(tag.id); setName(tag.name); setDeleteId(undefined); }}><RiEditLine size={16} /></Button>}{deleteId === tag.id ? <Button size="sm" variant="danger" onPress={() => { void inspirationRepository.deleteTag(tag.id); setDeleteId(undefined); }}>{t("确认删除")}</Button> : <Button size="icon" variant="dangerGhost" aria-label={tf("删除 {name}", { name: tag.name })} onPress={() => setDeleteId(tag.id)}><RiDeleteBinLine size={16} /></Button>}</div>
              </div>) : <div className="tag-manager-empty">{t("还没有标签。可在收藏项详情中添加。")}</div>}
            </div>
          </>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
