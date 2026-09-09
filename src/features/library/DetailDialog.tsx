import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiDeleteBinLine, RiEditLine, RiExternalLinkLine, RiImageLine, RiRefreshLine, RiSparkling2Line } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";
import { Dialog, DialogTitle, Modal, ModalOverlay } from "@/src/components/ui/Modal";
import { TagInput } from "@/src/components/ui/TagInput";
import { inspirationRepository } from "@/src/db/repository";
import type { ExtensionRequest } from "@/src/capture/types";
import type { LibraryItem, UpdateSavedItemInput } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";

interface DetailDialogProps {
  item: LibraryItem | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onUpdate: (input: UpdateSavedItemInput) => Promise<void>;
  onDelete: () => Promise<void>;
  siteItemCount: number;
  onShowSite: () => void;
  initialMode?: DetailMode;
  initialEditing?: boolean;
  initialEditFocus?: "tags";
}

type DetailMode = "details" | "snapshot" | "image";

export function DetailDialog({ item, onClose, onNavigate, onUpdate, onDelete, siteItemCount, onShowSite, initialMode = "details", initialEditing = false, initialEditFocus }: DetailDialogProps) {
  const snapshot = useLiveQuery(() => item ? inspirationRepository.getSnapshot(item.id) : undefined, [item?.id]);
  const tagOptions = useLiveQuery(() => inspirationRepository.listTags(), []) ?? [];
  const [mode, setMode] = useState<DetailMode>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverBlob, setCoverBlob] = useState<File>();
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [aiRetrying, setAiRetrying] = useState(false);

  useEffect(() => {
    if (!item) return;
    setMode(initialMode);
    setIsEditing(initialEditing);
    setTitle(item.title);
    setDescription(item.description);
    setTags(item.tags);
    setCoverBlob(undefined);
    setDeleteArmed(false);
    setAiRetrying(false);
  }, [initialEditing, initialMode, item]);

  useEffect(() => {
    if (!item || mode !== "details" || isEditing) return;
    const navigate = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      onNavigate(event.key === "ArrowLeft" ? -1 : 1);
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [isEditing, item, mode, onNavigate]);

  if (!item) return null;
  const kindLabel = { website: "网站", article: "文章", follow: "关注源" }[item.kind];
  const snapshotLabel = item.snapshotStatus === "complete" ? "完整" : item.snapshotStatus === "partial" ? "部分内容" : item.snapshotStatus === "pending" ? "等待采集" : "采集失败";
  const aiLabel = item.aiStatus === "complete" ? "已完成" : item.aiStatus === "failed" ? "处理失败" : "等待处理";
  const retryAi = async () => {
    setAiRetrying(true);
    try {
      await browser.runtime.sendMessage({ type: "ai:retry", itemId: item.id } satisfies ExtensionRequest);
    } finally {
      setAiRetrying(false);
    }
  };
  const save = async () => {
    await onUpdate({ title, description, tags, coverBlob });
    setIsEditing(false);
  };
  const cancelEdit = () => {
    setTitle(item.title);
    setDescription(item.description);
    setTags(item.tags);
    setCoverBlob(undefined);
    setIsEditing(false);
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen onOpenChange={(open) => !open && onClose()} isDismissable>
      <Modal className="detail-modal">
        <Dialog className={cn("detail-dialog", `kind-${item.kind}`, isEditing && "is-editing")} aria-label={mode === "snapshot" ? "正文快照" : "收藏项详情"}>
          <header className="detail-header">
            <Button size="icon" variant="ghost" aria-label={mode === "details" ? "关闭详情" : "返回详情"} onPress={() => mode === "details" ? onClose() : setMode("details")}><RiCloseLine size={19} /></Button>
            <span className="detail-host" title={item.sourceLabel}>{mode === "snapshot" ? "本地正文快照" : item.sourceLabel}</span>
            {mode === "details" ? isEditing ? <div className="detail-edit-controls"><Button variant="ghost" size="sm" onPress={cancelEdit}>取消</Button><Button variant="primary" size="sm" onPress={() => void save()}>保存修改</Button></div> : <a className="button button-primary button-sm" href={item.url} target="_blank" rel="noreferrer">打开原网页 <RiExternalLinkLine size={15} /></a> : <Button variant="primary" size="sm" onPress={() => setMode("details")}>返回详情</Button>}
          </header>
          <div className="detail-scroll">
            {mode === "snapshot" ? (
              <article className="snapshot-reader"><span>{snapshot?.byline || item.siteHost} · {snapshotLabel}</span><DialogTitle>{snapshot?.title || item.title}</DialogTitle>{snapshot?.cleanHtml ? <div className="snapshot-content" dangerouslySetInnerHTML={{ __html: snapshot.cleanHtml }} /> : <p className="snapshot-empty">这个收藏项还没有可阅读的正文快照。</p>}</article>
            ) : mode === "image" ? (
              <div className="image-viewer"><CoverArt item={item} large fit="contain" /><p>{item.title}</p></div>
            ) : (
              <>
                {item.kind !== "article" || item.cover.image || item.cover.blob ? <div className="detail-cover-wrap"><CoverArt item={item} large />{(item.cover.image || item.cover.blob) ? <Button variant="secondary" size="sm" className="detail-image-action" onPress={() => setMode("image")}><RiImageLine size={15} />查看封面</Button> : null}</div> : null}
                <div className="detail-copy">
                  {isEditing ? <form className="detail-inline-editor" onSubmit={(event) => { event.preventDefault(); void save(); }}>
                    <Field label="标题" value={title} onChange={setTitle} />
                    <Field label="描述" value={description} onChange={setDescription} multiline />
                    <TagInput label="标签" tags={tags} options={tagOptions} onChange={setTags} placement="bottom" revealBelowOnOpen autoFocus={initialEditFocus === "tags"} />
                    <div className="cover-picker"><span>封面</span><div><label className="button button-secondary button-sm" htmlFor="detail-cover-input">更换封面</label><small>{coverBlob ? `已选择：${coverBlob.name}` : "选择后将锁定封面，不再被自动采集覆盖。"}</small></div><input id="detail-cover-input" type="file" accept="image/*" onChange={(event) => setCoverBlob(event.target.files?.[0])} /></div>
                  </form> : <>
                    <div className="detail-title-row"><div><DialogTitle>{item.title}</DialogTitle><p>{item.description || "暂无描述"}</p></div></div>
                    <section className="detail-section"><div className="detail-taxonomy"><span className="kind-chip">{kindLabel}</span><div className="tag-list">{item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div></section>
                  </>}
                  {siteItemCount > 1 ? <Button variant="ghost" size="sm" onPress={onShowSite}>查看来自 {item.siteHost} 的 {siteItemCount} 个收藏项</Button> : null}
                  <div className="snapshot-row"><div><strong>正文快照</strong><span>{snapshotLabel} · 添加于 {item.savedAt}</span></div>{item.snapshotStatus === "failed" ? <a className="button button-secondary button-sm" href={item.url} target="_blank" rel="noreferrer" title="打开来源页面后，可通过扩展 Popup 重试采集">打开来源重试</a> : <Button variant="secondary" size="sm" isDisabled={!snapshot?.cleanHtml} onPress={() => setMode("snapshot")}>{item.snapshotStatus === "pending" ? "等待采集" : "阅读快照"}</Button>}</div>
                  <div className="snapshot-row ai-status-row"><div><strong><RiSparkling2Line size={15} />AI 整理</strong><span>{item.aiError || `${aiLabel}。人工描述和标签始终优先。`}</span></div>{item.aiStatus === "failed" ? <Button variant="secondary" size="sm" isDisabled={aiRetrying} onPress={() => void retryAi()}><RiRefreshLine size={15} />{aiRetrying ? "重试中…" : "重试 AI"}</Button> : null}</div>
                  {!isEditing ? <div className="detail-actions"><Button variant="secondary" onPress={() => setIsEditing(true)}><RiEditLine size={16} />编辑</Button><Button variant="danger" onPress={() => deleteArmed ? void onDelete() : setDeleteArmed(true)}><RiDeleteBinLine size={16} />{deleteArmed ? "再次点击确认删除" : "删除"}</Button></div> : null}
                </div>
              </>
            )}
          </div>
          <footer className="detail-footer">{mode === "details" && !isEditing ? <><Button size="icon" variant="ghost" aria-label="上一个收藏项" onPress={() => onNavigate(-1)}><RiArrowLeftLine size={18} /></Button><span>使用方向键切换</span><Button size="icon" variant="ghost" aria-label="下一个收藏项" onPress={() => onNavigate(1)}><RiArrowRightLine size={18} /></Button></> : <span>{isEditing ? "在当前详情中编辑，保存后立即更新" : mode === "snapshot" ? "快照保存在本地，原网页变化不会影响此内容" : "封面预览"}</span>}</footer>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
