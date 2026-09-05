import { RiArrowRightUpLine } from "@remixicon/react";
import { useLayoutEffect, useRef } from "react";
import { Badge } from "@/src/components/ui/Badge";
import type { InspirationItem } from "@/src/domain/inspiration";
import { CoverArt } from "./CoverArt";

export function InspirationCard({ item, onOpen, onTagClick, masonry = false }: { item: InspirationItem; onOpen: () => void; onTagClick: (tag: string) => void; masonry?: boolean }) {
  const cardRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !masonry) return;

    const updateSpan = () => {
      const height = card.getBoundingClientRect().height;
      card.style.gridRowEnd = `span ${Math.ceil(height + 12)}`;
    };

    updateSpan();
    const observer = new ResizeObserver(updateSpan);
    observer.observe(card);
    return () => {
      observer.disconnect();
      card.style.removeProperty("grid-row-end");
    };
  }, [masonry]);

  return (
    <article ref={cardRef} className="inspiration-card" tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === "Enter" && onOpen()}>
      <header className="card-source-row">
        <div>{item.siteIcon ? <img className="source-mark" src={item.siteIcon} alt="" /> : null}<span>{item.siteHost}</span></div>
        <div className="source-actions">
          <a className="card-source-link" href={item.url} target="_blank" rel="noreferrer" aria-label="打开原网页" onClick={(event) => event.stopPropagation()}><RiArrowRightUpLine size={16} /></a>
        </div>
      </header>
      <div className="card-cover-wrap">
        <CoverArt item={item} />
      </div>
      <div className="card-body">
        <a href={item.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
          <h2>{item.title}</h2>
        </a>
        <p>{item.description}</p>
      </div>
      {(item.note || item.tags.length > 0) && <footer className="card-note">
        {item.note && <p>{item.note}</p>}
        <div className="tag-list">
          {item.tags.map((tag) => <Badge key={tag} onClick={(event) => { event.stopPropagation(); onTagClick(tag); }}>{tag}</Badge>)}
        </div>
      </footer>}
    </article>
  );
}
