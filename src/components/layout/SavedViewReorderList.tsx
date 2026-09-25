import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { LibrarySavedView } from "@/src/domain/inspiration";
import { reorderSavedViewIds, savedViewInsertionTarget } from "@/src/lib/reorderSavedViews";
import { SavedViewNavItem } from "./SavedViewNavItem";
import { SidebarIcon } from "./SidebarIcon";

interface SavedViewReorderListProps {
  views: LibrarySavedView[];
  activeViewId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onMove: (sourceId: string, targetId: string) => void;
  showTooltip: boolean;
}

interface DragSession {
  pointerId: number;
  sourceId: string;
  originalOrder: string[];
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  bounds: { left: number; top: number; width: number; height: number };
  active: boolean;
  dropped: boolean;
}

export function SavedViewReorderList({ views, activeViewId, onSelect, onRename, onDelete, onMove, showTooltip }: SavedViewReorderListProps) {
  const [previewOrder, setPreviewOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const orderRef = useRef<string[]>(views.map((view) => view.id));
  const previousPositionsRef = useRef<Map<string, number> | null>(null);
  const animationsRef = useRef<Map<string, Animation>>(new Map());
  const settleTimerRef = useRef<number | undefined>(undefined);
  const removePointerListenersRef = useRef<(() => void) | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | undefined>(undefined);

  const viewIds = views.map((view) => view.id);
  const displayedIds = previewOrder && previewOrder.length === viewIds.length && previewOrder.every((id) => viewIds.includes(id)) ? previewOrder : viewIds;
  orderRef.current = displayedIds;
  const viewsById = new Map(views.map((view) => [view.id, view]));

  const capturePositions = () => {
    const positions = new Map<string, number>();
    listRef.current?.querySelectorAll<HTMLElement>("[data-saved-view-id]").forEach((row) => {
      const id = row.dataset.savedViewId;
      if (id) positions.set(id, row.getBoundingClientRect().top);
    });
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current.clear();
    previousPositionsRef.current = positions;
  };

  useLayoutEffect(() => {
    const previous = previousPositionsRef.current;
    previousPositionsRef.current = null;
    if (!previous || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    listRef.current?.querySelectorAll<HTMLElement>("[data-saved-view-id]").forEach((row) => {
      const id = row.dataset.savedViewId;
      const before = id ? previous.get(id) : undefined;
      if (before === undefined || id === draggingId) return;
      const delta = before - row.getBoundingClientRect().top;
      if (Math.abs(delta) < 1) return;
      const animation = row.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }],
        { duration: 240, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "both" },
      );
      animationsRef.current.set(id!, animation);
      animation.onfinish = () => { animation.cancel(); animationsRef.current.delete(id!); };
    });
  }, [displayedIds.join("|"), draggingId]);

  useEffect(() => {
    if (previewOrder && !draggingId && viewIds.join("|") === previewOrder.join("|")) setPreviewOrder(null);
  }, [viewIds.join("|"), draggingId, previewOrder]);

  const positionOverlay = (drag: DragSession) => {
    if (!overlayRef.current) return;
    const dx = Math.max(-8, Math.min(8, drag.lastX - drag.startX));
    overlayRef.current.style.transform = `translate3d(${dx}px, ${drag.lastY - drag.startY}px, 0)`;
  };

  useLayoutEffect(() => {
    if (dragRef.current?.active) positionOverlay(dragRef.current);
  }, [draggingId]);

  useEffect(() => () => {
    window.clearTimeout(settleTimerRef.current);
    window.clearTimeout(suppressClickTimerRef.current);
    removePointerListenersRef.current?.();
    animationsRef.current.forEach((animation) => animation.cancel());
  }, []);

  const previewAtPointer = (drag: DragSession, x: number, y: number) => {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-saved-view-id]");
    if (!row || !listRef.current?.contains(row)) return;
    const targetId = row.dataset.savedViewId;
    if (!targetId || targetId === drag.sourceId || viewsById.get(targetId)?.isSystem) return;
    const current = orderRef.current;
    const sourceIndex = current.indexOf(drag.sourceId);
    const targetIndex = current.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const middle = row.getBoundingClientRect().top + row.offsetHeight / 2;
    // A small midpoint tolerance accounts for fractional row coordinates and pixel-rounded pointers.
    if (sourceIndex < targetIndex && y < middle - 4) return;
    if (sourceIndex > targetIndex && y > middle + 4) return;
    const next = reorderSavedViewIds(current, drag.sourceId, targetId, sourceIndex < targetIndex);
    if (next.every((id, index) => id === current[index])) return;
    capturePositions();
    orderRef.current = next;
    setPreviewOrder(next);
  };

  const commitDrag = (drag: DragSession) => {
    drag.dropped = true;
    const finalOrder = orderRef.current;
    if (finalOrder.join("|") !== drag.originalOrder.join("|")) {
      onMove(drag.sourceId, savedViewInsertionTarget(finalOrder, drag.sourceId));
      settleTimerRef.current = window.setTimeout(() => { if (!dragRef.current) setPreviewOrder(null); }, 1500);
    } else {
      setPreviewOrder(null);
    }
    const settle = () => {
      if (dragRef.current !== drag) return;
      setDraggingId(null);
      setOverlay(null);
      dragRef.current = null;
    };
    const draggedRow = listRef.current?.querySelector<HTMLElement>(`[data-saved-view-id="${drag.sourceId}"]`);
    const floatingRow = overlayRef.current;
    if (draggedRow && floatingRow && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const target = draggedRow.getBoundingClientRect();
      const from = floatingRow.style.transform || "translate3d(0, 0, 0)";
      const animation = floatingRow.animate(
        [{ transform: from }, { transform: `translate3d(${target.left - drag.bounds.left}px, ${target.top - drag.bounds.top}px, 0)` }],
        { duration: 180, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "forwards" },
      );
      animation.onfinish = settle;
    } else settle();
  };

  const cancelDrag = (drag: DragSession) => {
    if (!drag.active) { dragRef.current = null; return; }
    capturePositions();
    setPreviewOrder(null);
    dragRef.current = null;
    setDraggingId(null);
    setOverlay(null);
  };

  const handlePointerDown = (id: string, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0 || event.pointerType === "touch" || dragRef.current) return;
    if ((event.target as HTMLElement).closest(".saved-view-more, .saved-view-editor")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const drag: DragSession = { pointerId: event.pointerId, sourceId: id, originalOrder: [...viewIds], startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, bounds: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, active: false, dropped: false };
    dragRef.current = drag;

    const removeListeners = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", blur);
      removePointerListenersRef.current = null;
    };
    const finish = (commit: boolean) => {
      removeListeners();
      if (drag.active) {
        window.clearTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      }
      if (commit && drag.active) commitDrag(drag);
      else cancelDrag(drag);
    };
    const move = (pointer: globalThis.PointerEvent) => {
      if (pointer.pointerId !== drag.pointerId || drag.dropped) return;
      drag.lastX = pointer.clientX;
      drag.lastY = pointer.clientY;
      if (!drag.active) {
        if (Math.hypot(pointer.clientX - drag.startX, pointer.clientY - drag.startY) < 5) return;
        drag.active = true;
        suppressClickRef.current = true;
        window.clearTimeout(settleTimerRef.current);
        setOverlay(drag.bounds);
        setDraggingId(id);
        setPreviewOrder([...viewIds]);
      }
      pointer.preventDefault();
      positionOverlay(drag);
      previewAtPointer(drag, pointer.clientX, pointer.clientY);
    };
    const up = (pointer: globalThis.PointerEvent) => {
      if (pointer.pointerId !== drag.pointerId) return;
      const bounds = listRef.current?.getBoundingClientRect();
      finish(Boolean(bounds && pointer.clientX >= bounds.left && pointer.clientX <= bounds.right && pointer.clientY >= bounds.top && pointer.clientY <= bounds.bottom));
    };
    const cancel = (pointer: globalThis.PointerEvent) => { if (pointer.pointerId === drag.pointerId) finish(false); };
    const keydown = (key: globalThis.KeyboardEvent) => { if (key.key === "Escape") { key.preventDefault(); finish(false); } };
    const blur = () => finish(false);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", keydown);
    window.addEventListener("blur", blur);
    removePointerListenersRef.current = removeListeners;
  };

  const draggedView = draggingId ? viewsById.get(draggingId) : undefined;

  return <>
    <div ref={listRef} className="nav-list saved-view-reorder-list">
      {displayedIds.map((id) => {
        const view = viewsById.get(id);
        if (!view) return null;
        return <SavedViewNavItem key={id} view={view} icon={<SidebarIcon src={`/assets/sidebar/${view.isSystem ? "timer" : "lightbulb"}.svg`} />} isActive={activeViewId === id} onPress={() => { if (!suppressClickRef.current) onSelect(id); }} onRename={(name) => onRename(id, name)} onDelete={() => onDelete(id)} showTooltip={showTooltip} isReorderDragging={draggingId === id} onReorderPointerDown={(event) => handlePointerDown(id, event)} />;
      })}
    </div>
    {overlay && draggedView ? createPortal(<div ref={overlayRef} className="saved-view-drag-overlay" style={overlay} aria-hidden="true"><SidebarIcon src="/assets/sidebar/lightbulb.svg" /><span>{draggedView.name}</span></div>, document.body) : null}
  </>;
}
