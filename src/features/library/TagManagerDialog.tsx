import { RiCloseLine, RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { inspirationRepository } from "@/src/db/repository";

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
            <header className="form-dialog-header settings-header"><div><DialogTitle>管理标签</DialogTitle><p>重命名为已有标签会自动合并，并保留原名称作为别名。</p></div><Button size="icon" variant="ghost" aria-label="关闭标签管理" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="tag-manager-list">
              {tags.length ? tags.map((tag) => <div className="tag-manager-row" key={tag.id}>
                {editingId === tag.id ? <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void save(tag.id); if (event.key === "Escape") setEditingId(undefined); }} aria-label={`重命名 ${tag.name}`} /> : <div><strong>#{tag.name}</strong><span>{tag.usageCount} 个收藏项{tag.aliases.length ? ` · 别名 ${tag.aliases.join("、")}` : ""}</span></div>}
                <div>{editingId === tag.id ? <Button size="sm" variant="primary" onPress={() => void save(tag.id)}>保存</Button> : <Button size="icon" variant="ghost" aria-label={`重命名 ${tag.name}`} onPress={() => { setEditingId(tag.id); setName(tag.name); setDeleteId(undefined); }}><RiEditLine size={16} /></Button>}{deleteId === tag.id ? <Button size="sm" variant="danger" onPress={() => { void inspirationRepository.deleteTag(tag.id); setDeleteId(undefined); }}>确认删除</Button> : <Button size="icon" variant="ghost" aria-label={`删除 ${tag.name}`} onPress={() => setDeleteId(tag.id)}><RiDeleteBinLine size={16} /></Button>}</div>
              </div>) : <div className="tag-manager-empty">还没有标签。可在收藏项详情中添加。</div>}
            </div>
          </>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
