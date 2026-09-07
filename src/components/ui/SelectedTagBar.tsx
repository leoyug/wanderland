import { RiArrowDownSLine, RiCloseLine } from "@remixicon/react";
import { useMemo, useState, type ReactNode } from "react";

interface SelectedTagBarProps {
  tags: string[];
  onRemove: (tag: string) => void;
  actions?: ReactNode;
  visibleLimit?: number;
}

export function SelectedTagBar({ tags, onRemove, actions, visibleLimit = 4 }: SelectedTagBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleTags = useMemo(() => isExpanded ? tags : tags.slice(0, visibleLimit), [isExpanded, tags, visibleLimit]);
  const hiddenCount = Math.max(0, tags.length - visibleTags.length);

  return (
    <div className="selected-tag-bar">
      <div className="selected-tag-list" aria-label="已选标签">
        {visibleTags.map((tag) => (
          <button key={tag} type="button" className="selected-tag" onClick={() => onRemove(tag)} aria-label={`移除标签 ${tag}`}>
            <span aria-hidden="true">#</span>{tag}<RiCloseLine size={13} aria-hidden="true" />
          </button>
        ))}
        {tags.length > visibleLimit ? (
          <button type="button" className="selected-tag-toggle" onClick={() => setIsExpanded((current) => !current)} aria-expanded={isExpanded}>
            {isExpanded ? "收起" : `+${hiddenCount}`}<RiArrowDownSLine size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {actions ? <div className="selected-tag-meta">{actions}</div> : null}
    </div>
  );
}
