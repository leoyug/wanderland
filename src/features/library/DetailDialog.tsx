import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiExternalLinkLine } from "@remixicon/react";
import { useEffect } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { StatusDot } from "@/src/components/ui/StatusDot";
import type { SavedItem } from "@/src/domain/inspiration";

interface DetailDialogProps {
  item: SavedItem | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

export function DetailDialog({ item, onClose, onNavigate }: DetailDialogProps) {
  useEffect(() => {
    if (!item) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const target = event.target as HTMLElement | null;
        if (target?.matches("input, textarea, [contenteditable='true']")) return;
        event.preventDefault();
        onNavigate(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [item, onNavigate]);

  const kindLabel = item ? { website: "网站", article: "文章", follow: "关注源" }[item.kind] : "";
  const snapshotLabel = item?.aiStatus === "complete" ? "完整" : item?.aiStatus === "pending" ? "待补全" : "采集失败";

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
                    <h3>内容类型与标签</h3>
                    <div className="detail-taxonomy"><span className="kind-chip">{kindLabel}</span><div className="tag-list">{item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div>
                  </section>
                  <div className="snapshot-row">
                    <div><strong>正文快照</strong><span>{snapshotLabel} · 添加于 {item.savedAt}</span></div>
                    <Button variant="secondary" size="sm">查看快照</Button>
                  </div>
                </div>
              </div>
              <footer className="detail-footer">
                <Button size="icon" variant="ghost" aria-label="上一个收藏项" onPress={() => onNavigate(-1)}><RiArrowLeftLine size={18} /></Button>
                <span>使用方向键切换</span>
                <Button size="icon" variant="ghost" aria-label="下一个收藏项" onPress={() => onNavigate(1)}><RiArrowRightLine size={18} /></Button>
              </footer>
            </>
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
