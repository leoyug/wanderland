import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, MenuItem } from "react-aria-components";
import { cn } from "@/src/lib/cn";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onAction: () => void | Promise<void>;
  separatorBefore?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  label: string;
  position: { x: number; y: number };
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ label, position, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [resolvedPosition, setResolvedPosition] = useState<{ x: number; y: number }>();

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const resolve = () => {
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const rect = menu.getBoundingClientRect();
      const edge = 8;
      const next = {
        x: Math.max(viewportLeft + edge, Math.min(position.x, viewportLeft + viewportWidth - rect.width - edge)),
        y: Math.max(viewportTop + edge, Math.min(position.y, viewportTop + viewportHeight - rect.height - edge)),
      };
      setResolvedPosition((current) => current?.x === next.x && current.y === next.y ? current : next);
    };
    resolve();
    const observer = new ResizeObserver(resolve);
    observer.observe(menu);
    window.visualViewport?.addEventListener("resize", resolve);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", resolve);
    };
  }, [actions.length, position.x, position.y]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", onClose);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="popover-surface item-context-popover"
      style={{
        left: resolvedPosition?.x ?? position.x,
        top: resolvedPosition?.y ?? position.y,
        visibility: resolvedPosition ? "visible" : "hidden",
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Menu
        aria-label={label}
        autoFocus="first"
        className="menu-content item-context-menu"
        onAction={(key) => {
          const action = actions.find((candidate) => candidate.id === String(key));
          if (!action || action.disabled) return;
          void action.onAction();
          onClose();
        }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            id={action.id}
            isDisabled={action.disabled}
            className={cn("menu-item", action.separatorBefore && "menu-item-separated", action.danger && "is-danger")}
          >
            {action.icon}<span>{action.label}</span>
          </MenuItem>
        ))}
      </Menu>
    </div>,
    document.body,
  );
}
