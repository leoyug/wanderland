import { RiArrowRightUpLine, RiBookmarkFill, RiBookmarkLine } from "@remixicon/react";
import { Badge } from "@/src/components/ui/Badge";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { CoverArt } from "./CoverArt";
import { SiteIcon } from "./SiteIcon";

interface InspirationListItemProps {
  item: LibraryItem;
  onOpen: () => void;
  onTagClick: (tag: string) => void;
  onToggleFavorite: () => void;
}

export function InspirationListItem({ item, onOpen, onTagClick, onToggleFavorite }: InspirationListItemProps) {
  const hasCoverImage = Boolean(item.cover.image || item.cover.blob);

  return (
    <article className={cn("inspiration-list-item", `kind-${item.kind}`)} tabIndex={0} onClick={onOpen} onKeyDown={(event) => event.key === "Enter" && onOpen()}>
      <div className="list-item-copy">
        <header className="list-item-source">
          <SiteIcon src={item.siteIcon} pageUrl={item.url} />
          <a className="card-url-link" href={item.url} target="_blank" rel="noreferrer" title={item.sourceLabel} onClick={(event) => event.stopPropagation()}>
            <span className="card-url-text">{item.sourceLabel}</span><RiArrowRightUpLine size={14} aria-hidden="true" />
          </a>
        </header>
        <h2 className="list-item-title">{item.title}</h2>
        {item.tags.length ? <footer className="list-item-tags">{item.tags.map((tag) => <Badge key={tag} variant="neutral" size="sm" onPress={(event) => { event.stopPropagation(); onTagClick(tag); }}>{tag}</Badge>)}</footer> : null}
      </div>
      {item.kind === "website" && hasCoverImage ? <div className="list-item-cover"><CoverArt item={item} /></div> : null}
      {item.kind === "follow" ? <SiteIcon src={item.siteIcon} pageUrl={item.url} variant="avatar" /> : null}
      <button className={cn("favorite-button", item.isFavorite && "is-active")} type="button" aria-label={item.isFavorite ? "取消星标" : "添加星标"} aria-pressed={item.isFavorite} onClick={(event) => { event.stopPropagation(); onToggleFavorite(); }}>
        {item.isFavorite ? <RiBookmarkFill size={16} /> : <RiBookmarkLine size={16} />}
      </button>
    </article>
  );
}
