import { useSmoothCorners } from "@lisse/react";
import { RiArrowRightUpLine } from "@remixicon/react";
import { useLayoutEffect, useRef, type MouseEventHandler } from "react";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { CoverArt } from "./CoverArt";
import { FavoriteButton } from "./FavoriteButton";
import { getInspirationPresentation } from "./getInspirationPresentation";
import { SiteIcon } from "./SiteIcon";
import { TagSummary } from "./TagSummary";

export type InspirationLayout = "cards" | "compact" | "list";

interface InspirationCardProps {
  item: LibraryItem;
  onOpen: () => void;
  onTagClick: (tag: string) => void;
  onToggleFavorite?: () => void;
  onContextMenu?: MouseEventHandler<HTMLElement>;
  layout?: InspirationLayout;
  masonry?: boolean;
}

export function InspirationCard({ item, onOpen, onTagClick, onToggleFavorite, onContextMenu, layout = "cards", masonry = false }: InspirationCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const presentation = getInspirationPresentation(item);
  useSmoothCorners(cardRef, { radius: 12, smoothing: 0.6 }, {
    wrapperRef: shellRef,
    autoEffects: false,
    effects: { innerBorder: { width: 0.5, color: "var(--smooth-card-border)", opacity: 1 } },
  });

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell || !masonry) return;
    let frameId: number | null = null;
    const updateSpan = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
        const nextRowEnd = `span ${Math.ceil(shell.getBoundingClientRect().height + 8)}`;
        if (shell.style.gridRowEnd !== nextRowEnd) shell.style.gridRowEnd = nextRowEnd;
      });
    };
    updateSpan();
    const observer = new ResizeObserver(updateSpan);
    observer.observe(shell);
    return () => {
      observer.disconnect();
      if (frameId !== null) cancelAnimationFrame(frameId);
      shell.style.removeProperty("grid-row-end");
    };
  }, [masonry]);

  const body = <div className="card-body"><h2>{presentation.title}</h2>{presentation.description ? <p>{presentation.description}</p> : null}</div>;
  const cover = <div className="card-cover-wrap"><CoverArt item={item} /></div>;
  const tags = <TagSummary key={item.id} className="card-tags" tags={item.tags} onTagClick={onTagClick} />;
  const followContent = <div className="follow-profile"><SiteIcon item={item} variant="avatar" />{body}</div>;

  return (
    <div ref={shellRef} className="inspiration-card-shell">
      <article ref={cardRef} className={cn("inspiration-card", `kind-${item.kind}`, layout === "compact" && "is-compact")} tabIndex={0} onClick={onOpen} onContextMenu={onContextMenu} onKeyDown={(event) => {
        if (event.key === "Enter") onOpen();
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: rect.left + 20, clientY: rect.top + 20 }));
        }
      }}>
        <header className="card-source-row">
          <div><SiteIcon item={item} /><a className="card-url-link" href={item.url} target="_blank" rel="noreferrer" title={item.sourceLabel} onClick={(event) => event.stopPropagation()}><span className="card-url-text">{presentation.sourceLabel}</span><RiArrowRightUpLine size={14} aria-hidden="true" /></a></div>
          <div className="source-actions">
            {onToggleFavorite && <FavoriteButton isFavorite={item.isFavorite} onToggle={onToggleFavorite} />}
          </div>
        </header>
        <div className="card-content-region">
          {layout === "cards" ? <>
            {item.kind === "website" ? <div className="card-main">{cover}{body}</div> : null}
            {item.kind === "article" ? <div className="article-content">{body}</div> : null}
            {item.kind === "follow" ? followContent : null}
          </> : <div className="compact-card-content">
            {item.kind === "website" ? <>{cover}<div className="list-card-copy">{body}</div></> : null}
            {item.kind === "article" ? <div className="list-card-copy">{body}</div> : null}
            {item.kind === "follow" ? followContent : null}
          </div>}
          {tags}
        </div>
      </article>
    </div>
  );
}
