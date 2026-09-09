import { RiArrowRightUpLine, RiBookmarkFill, RiBookmarkLine } from "@remixicon/react";
import { useLayoutEffect, useRef, type MouseEventHandler } from "react";
import { Badge } from "@/src/components/ui/Badge";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { CoverArt } from "./CoverArt";
import { SiteIcon } from "./SiteIcon";

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

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !masonry) return;
    const updateSpan = () => { card.style.gridRowEnd = `span ${Math.ceil(card.getBoundingClientRect().height + 12)}`; };
    updateSpan();
    const observer = new ResizeObserver(updateSpan);
    observer.observe(card);
    return () => { observer.disconnect(); card.style.removeProperty("grid-row-end"); };
  }, [masonry]);

  const body = <div className="card-body"><h2>{item.title}</h2>{item.description ? <p>{item.description}</p> : null}</div>;
  const cover = <div className="card-cover-wrap"><CoverArt item={item} /></div>;
  const tags = item.tags.length > 0 ? <footer className="card-tags">{item.tags.map((tag) => <Badge key={tag} variant="neutral" size="sm" onPress={(event) => { event.stopPropagation(); onTagClick(tag); }}>{tag}</Badge>)}</footer> : null;
  const followContent = <div className="follow-profile"><SiteIcon src={item.siteIcon} pageUrl={item.url} variant="avatar" />{body}</div>;

  return (
    <article ref={cardRef} className={cn("inspiration-card", `kind-${item.kind}`, layout === "compact" && "is-compact")} tabIndex={0} onClick={onOpen} onContextMenu={onContextMenu} onKeyDown={(event) => {
      if (event.key === "Enter") onOpen();
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: rect.left + 20, clientY: rect.top + 20 }));
      }
    }}>
      <header className="card-source-row">
        <div><SiteIcon src={item.siteIcon} pageUrl={item.url} /><a className="card-url-link" href={item.url} target="_blank" rel="noreferrer" title={item.sourceLabel} onClick={(event) => event.stopPropagation()}><span className="card-url-text">{item.sourceLabel}</span><RiArrowRightUpLine size={14} aria-hidden="true" /></a></div>
        <div className="source-actions">
          {onToggleFavorite && <button className={cn("favorite-button", item.isFavorite && "is-active")} type="button" aria-label={item.isFavorite ? "取消星标" : "添加星标"} aria-pressed={item.isFavorite} onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}>{item.isFavorite ? <RiBookmarkFill size={16} /> : <RiBookmarkLine size={16} />}</button>}
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
  );
}
