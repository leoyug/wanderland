import { RiAddLine, RiArticleLine, RiGlobalLine, RiUserFollowLine } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import type { SavedItemKind } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";

const actions = [
  { kind: "website", label: "网站", description: "保存网页", icon: RiGlobalLine },
  { kind: "article", label: "文章", description: "稍后阅读", icon: RiArticleLine },
  { kind: "follow", label: "关注源", description: "持续关注", icon: RiUserFollowLine },
] as const;

interface FloatingAddMenuProps {
  onSelect: (kind: SavedItemKind) => void;
  placement?: "fixed" | "preview";
}

export function FloatingAddMenu({ onSelect, placement = "fixed" }: FloatingAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setIsOpen(false), 160);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); cancelClose(); };
  }, []);

  return (
    <div className={cn("floating-add", `floating-add-${placement}`, isOpen && "is-open")} onPointerEnter={() => { cancelClose(); setIsOpen(true); }} onPointerLeave={scheduleClose} onFocusCapture={() => setIsOpen(true)} onBlurCapture={scheduleClose}>
      <div className="floating-menu-panel" aria-hidden={!isOpen}>
        <div className="floating-menu-heading"><span>选择添加类型</span></div>
        {actions.map(({ kind, label, description, icon: Icon }) => (
          <button type="button" className="floating-action" key={kind} tabIndex={isOpen ? 0 : -1} onClick={(event) => { event.currentTarget.blur(); onSelect(kind); setIsOpen(false); }}>
            <Icon size={18} aria-hidden="true" /><span>{label}</span><small>{description}</small>
          </button>
        ))}
      </div>
      <button type="button" className="floating-trigger" aria-label="添加内容" aria-expanded={isOpen} onClick={(event) => event.detail === 0 ? setIsOpen((open) => !open) : setIsOpen(true)}><RiAddLine size={25} /></button>
    </div>
  );
}
