import { RiArrowRightUpLine } from "@remixicon/react";
import type { MouseEventHandler } from "react";
import { Badge } from "@/src/components/ui/Badge";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { CoverArt } from "./CoverArt";
import { FavoriteButton } from "./FavoriteButton";
import { getInspirationPresentation } from "./getInspirationPresentation";
import { SiteIcon } from "./SiteIcon";

interface InspirationListItemProps {
  item: LibraryItem;
  onOpen: () => void;
  onTagClick: (tag: string) => void;
  onToggleFavorite: () => void;
  onContextMenu?: MouseEventHandler<HTMLElement>;
}

export function InspirationListItem({ item, onOpen, onTagClick, onToggleFavorite, onContextMenu }: InspirationListItemProps) {
  const hasCoverImage = Boolean(item.cover.image || item.cover.blob);
  const presentation = getInspirationPresentation(item);

  return (
    <article className={cn("inspiration-list-item", `kind-${item.kind}`)} tabIndex={0} onClick={onOpen} onContextMenu={onContextMenu} onKeyDown={(event) => {
      if (event.key === "Enter") onOpen();
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: rect.left + 20, clientY: rect.top + 20 }));
      }
    }}>
      <div className="list-item-copy">
        <header className="list-item-source">
          <SiteIcon src={item.siteIcon} pageUrl={item.url} />
          <a className="card-url-link" href={item.url} target="_blank" rel="noreferrer" title={item.sourceLabel} onClick={(event) => event.stopPropagation()}>
            <span className="card-url-text">{presentation.sourceLabel}</span><RiArrowRightUpLine size={14} aria-hidden="true" />
          </a>
        </header>
        <h2 className="list-item-title">{presentation.title}</h2>
        {item.tags.length ? <footer className="list-item-tags">{item.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="neutral" size="sm" onPress={(event) => { event.stopPropagation(); onTagClick(tag); }}>{tag}</Badge>)}</footer> : null}
      </div>
      {item.kind === "website" && hasCoverImage ? <div className="list-item-cover"><CoverArt item={item} /></div> : null}
      {item.kind === "follow" ? <SiteIcon src={item.siteIcon} pageUrl={item.url} variant="avatar" /> : null}
      <FavoriteButton isFavorite={item.isFavorite} onToggle={onToggleFavorite} />
    </article>
  );
}
