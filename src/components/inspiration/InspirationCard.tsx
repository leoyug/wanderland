import { RiArrowRightUpLine, RiBookmarkFill, RiBookmarkLine } from "@remixicon/react";
import { useLayoutEffect, useRef } from "react";
import { Badge } from "@/src/components/ui/Badge";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { CoverArt } from "./CoverArt";

export type InspirationLayout = "cards" | "list";

interface InspirationCardProps {
  item: LibraryItem;
  onOpen: () => void;
  onTagClick: (tag: string) => void;
  onToggleFavorite?: () => void;
  layout?: InspirationLayout;
  masonry?: boolean;
}

export function InspirationCard({ item, onOpen, onTagClick, onToggleFavorite, layout = "cards", masonry = false }: InspirationCardProps) {
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
  const tags = item.tags.length > 0 ? <footer className="card-tags">{item.tags.map((tag) => <Badge key={tag} variant="neutral" onClick={(event) => { event.stopPropagation(); onTagClick(tag); }}>{tag}</Badge>)}</footer> : null;
  const followContent = <div className="follow-profile">{item.siteIcon ? <img className="follow-avatar" src={item.siteIcon} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}{body}</div>;

  return (
    <article ref={cardRef} className={cn("inspiration-card", `kind-${item.kind}`, layout === "list" && "is-list")} tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === "Enter" && onOpen()}>
      <header className="card-source-row">
        <div>{item.siteIcon ? <img className="source-mark" src={item.siteIcon} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}<a className="card-url-link" href={item.url} target="_blank" rel="noreferrer" title={item.sourceLabel} onClick={(event) => event.stopPropagation()}>{item.sourceLabel}</a></div>
        <div className="source-actions">
          {onToggleFavorite && <button className={cn("favorite-button", item.isFavorite && "is-active")} type="button" aria-label={item.isFavorite ? "取消星标" : "添加星标"} aria-pressed={item.isFavorite} onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}>{item.isFavorite ? <RiBookmarkFill size={16} /> : <RiBookmarkLine size={16} />}</button>}
          <a className="card-source-link" href={item.url} target="_blank" rel="noreferrer" aria-label="打开原网页" onClick={(event) => event.stopPropagation()}><RiArrowRightUpLine size={16} /></a>
        </div>
      </header>
      <div className="card-content-region">
        {layout === "cards" ? <>
          {item.kind === "website" ? <div className="card-main">{cover}{body}</div> : null}
          {item.kind === "article" ? <div className="article-content">{body}</div> : null}
          {item.kind === "follow" ? followContent : null}
        </> : <div className="list-card-content">
          {item.kind === "website" ? <>{cover}<div className="list-card-copy">{body}</div></> : null}
          {item.kind === "article" ? <div className="list-card-copy">{body}</div> : null}
          {item.kind === "follow" ? followContent : null}
        </div>}
        {tags}
      </div>
    </article>
  );
}
