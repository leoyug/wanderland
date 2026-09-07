import { RiDeleteBinLine, RiEditLine, RiMore2Line } from "@remixicon/react";
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { SavedView } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { SidebarIcon } from "./SidebarIcon";

interface SavedViewNavItemProps {
  view: SavedView;
  iconSrc: string;
  isActive: boolean;
  onPress: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (targetId: string) => void;
}

export function SavedViewNavItem({ view, iconSrc, isActive, onPress, onRename, onDelete, onMove }: SavedViewNavItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [draft, setDraft] = useState(view.name);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsDeleteArmed(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isMenuOpen]);

  const finishEditing = () => {
    const name = draft.trim();
    if (name && name !== view.name) onRename(name);
    else setDraft(view.name);
    setIsEditing(false);
  };

  const handleEditKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") finishEditing();
    if (event.key === "Escape") {
      setDraft(view.name);
      setIsEditing(false);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (view.isSystem) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-wanderland-view", view.id);
    event.currentTarget.classList.add("is-dragging");
  };

  return (
    <div
      ref={rootRef}
      className={cn("nav-entry saved-view-entry", isActive && "is-active", isMenuOpen && "has-open-menu")}
      draggable={!view.isSystem && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={(event) => event.currentTarget.classList.remove("is-dragging")}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
      onDrop={(event) => {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData("application/x-wanderland-view");
        if (sourceId && sourceId !== view.id) onMove(sourceId);
      }}
    >
      {isEditing ? (
        <div className="saved-view-editor">
          <SidebarIcon src={iconSrc} />
          <input ref={inputRef} value={draft} aria-label="快捷视图名称" onChange={(event) => setDraft(event.target.value)} onKeyDown={handleEditKeys} onBlur={finishEditing} />
        </div>
      ) : (
        <button type="button" onClick={onPress} className={cn("nav-item saved-view-select", isActive && "is-active")}>
          <SidebarIcon src={iconSrc} />
          <span>{view.name}</span>
        </button>
      )}

      {!view.isSystem && !isEditing ? (
        <>
          <button type="button" className="saved-view-more" aria-label={`管理快捷视图“${view.name}”`} aria-expanded={isMenuOpen} onClick={() => { setIsMenuOpen((open) => !open); setIsDeleteArmed(false); }}>
            <RiMore2Line size={16} aria-hidden="true" />
          </button>
          {isMenuOpen ? (
            <div className="popover-surface saved-view-menu" role="menu" aria-label={`管理${view.name}`}>
              <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsEditing(true); }}><RiEditLine size={15} />编辑名称</button>
              <button type="button" role="menuitem" className="is-danger" onClick={() => { if (isDeleteArmed) onDelete(); else setIsDeleteArmed(true); }}><RiDeleteBinLine size={15} />{isDeleteArmed ? "确认删除" : "删除视图"}</button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
