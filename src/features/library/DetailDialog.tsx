import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiExternalLinkLine } from "@remixicon/react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { StatusDot } from "@/src/components/ui/StatusDot";
import type { InspirationItem } from "@/src/domain/inspiration";

interface DetailDialogProps {
  item: InspirationItem | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export function DetailDialog({ item, onClose, onNavigate }: DetailDialogProps) {
  return (
    <ModalOverlay className="detail-overlay" isOpen={Boolean(item)} onOpenChange={(open) => !open && onClose()} isDismissable>
      <Modal className="detail-modal">
        <Dialog className="detail-dialog">
          {({ close }) => item ? (
            <>
              <header className="detail-header">
                <Button size="icon" variant="ghost" aria-label="关闭详情" onPress={close}><RiCloseLine size={19} /></Button>
                <span className="detail-host">{item.siteHost}</span>
                <a className="button button-primary button-sm" href={item.url} target="_blank" rel="noreferrer">打开原网页 <RiExternalLinkLine size={15} /></a>
              </header>
              <div className="detail-scroll">
                <CoverArt item={item} large />
                <div className="detail-copy">
                  <div className="detail-title-row">
                    <div>
                      <Heading slot="title">{item.title}</Heading>
                      <p>{item.description}</p>
                    </div>
                    <StatusDot status={item.aiStatus} />
                  </div>
                  <section className="detail-section">
                    <h3>频道与标签</h3>
                    <div className="tag-list">{item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                  </section>
                  <Field label="备注" defaultValue={item.note} multiline />
                  <div className="snapshot-row">
                    <div><strong>正文快照</strong><span>完整 · 收藏于 {item.savedAt}</span></div>
                    <Button variant="secondary" size="sm">查看快照</Button>
                  </div>
                </div>
              </div>
              <footer className="detail-footer">
                <Button size="icon" variant="ghost" aria-label="上一个灵感" onPress={() => onNavigate(-1)}><RiArrowLeftLine size={18} /></Button>
                <span>使用方向键切换</span>
                <Button size="icon" variant="ghost" aria-label="下一个灵感" onPress={() => onNavigate(1)}><RiArrowRightLine size={18} /></Button>
              </footer>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
