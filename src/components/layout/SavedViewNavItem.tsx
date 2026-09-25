import { RiDeleteBinLine, RiEditLine, RiMore2Line } from "@remixicon/react";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import type { LibrarySavedView } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";

interface SavedViewNavItemProps {
  view: LibrarySavedView;
  icon: ReactNode;
  isActive: boolean;
  onPress: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  showTooltip?: boolean;
  isReorderDragging?: boolean;
  onReorderPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

export function SavedViewNavItem({ view, icon, isActive, onPress, onRename, onDelete, showTooltip = false, isReorderDragging = false, onReorderPointerDown }: SavedViewNavItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [draft, setDraft] = useState(view.name);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number }>();

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsDeleteArmed(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isMenuOpen]);

  useLayoutEffect(() => {
    if (!isMenuOpen) {
      setMenuPosition(undefined);
      return;
    }
    const positionMenu = () => {
      const trigger = moreButtonRef.current;
      if (!trigger) return;
      const triggerRect = trigger.getBoundingClientRect();
      const menuWidth = 174;
      const menuHeight = menuRef.current?.offsetHeight ?? 78;
      const viewportPadding = 8;
      const frozenBottom = document.querySelector<HTMLElement>(".sidebar-bottom")?.getBoundingClientRect().top ?? window.innerHeight;
      const bottomLimit = Math.min(window.innerHeight - viewportPadding, frozenBottom - viewportPadding);
      const left = Math.min(Math.max(viewportPadding, triggerRect.right - menuWidth), window.innerWidth - menuWidth - viewportPadding);
      const below = triggerRect.bottom + 8;
      const top = below + menuHeight <= bottomLimit ? below : Math.max(viewportPadding, triggerRect.top - menuHeight - 8);
      setMenuPosition({ left, top });
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
    };
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

  return (
    <div
      ref={rootRef}
      data-saved-view-id={view.id}
      data-reorderable={!view.isSystem && !isEditing ? "" : undefined}
      className={cn("nav-entry saved-view-entry", isActive && "is-active", isMenuOpen && "has-open-menu", isReorderDragging && "is-dragging")}
      onPointerDownCapture={(event) => { if (!view.isSystem && !isEditing) onReorderPointerDown?.(event); }}
      onDragStart={(event) => event.preventDefault()}
    >
      {isEditing ? (
        <div className="saved-view-editor">
          {icon}
          <input ref={inputRef} value={draft} aria-label="快捷视图名称" onChange={(event) => setDraft(event.target.value)} onKeyDown={handleEditKeys} onBlur={finishEditing} />
        </div>
      ) : (
        showTooltip ? (
          <Tooltip content={view.name} placement="right" offset={10} className="sidebar-tooltip-bubble">
            <Button type="button" variant="ghost" onPress={onPress} className={cn("nav-item saved-view-select", isActive && "is-active")} aria-label={view.name}>
              {icon}
              <span>{view.name}</span>
            </Button>
          </Tooltip>
        ) : (
          <Button type="button" variant="ghost" onPress={onPress} className={cn("nav-item saved-view-select", isActive && "is-active")} aria-label={view.name}>
            {icon}
            <span>{view.name}</span>
          </Button>
        )
      )}

      {!view.isSystem && !isEditing ? (
        <>
          <button ref={moreButtonRef} type="button" className="saved-view-more" aria-label={`管理快捷视图“${view.name}”`} aria-expanded={isMenuOpen} onClick={() => { setIsMenuOpen((open) => !open); setIsDeleteArmed(false); }}>
            <RiMore2Line size={16} aria-hidden="true" />
          </button>
          {isMenuOpen && menuPosition ? createPortal(
            <div ref={menuRef} className="popover-surface saved-view-menu" role="menu" aria-label={`管理${view.name}`} style={menuPosition}>
              <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsEditing(true); }}><RiEditLine size={15} />编辑名称</button>
              <button type="button" role="menuitem" className="is-danger" onClick={() => { if (isDeleteArmed) onDelete(); else setIsDeleteArmed(true); }}><RiDeleteBinLine size={15} />{isDeleteArmed ? "确认删除" : "删除视图"}</button>
            </div>,
            document.body,
          ) : null}
        </>
      ) : null}
    </div>
  );
}
