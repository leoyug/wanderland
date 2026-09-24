import { useState, type KeyboardEventHandler, type MouseEventHandler } from "react";
import { Badge } from "@/src/components/ui/Badge";
import { cn } from "@/src/lib/cn";

const TAG_PREVIEW_LIMIT = 3;

interface TagSummaryProps {
  tags: string[];
  onTagClick: (tag: string) => void;
  className?: string;
}

export function TagSummary({ tags, onTagClick, className }: TagSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!tags.length) return null;

  const hasHiddenTags = tags.length > TAG_PREVIEW_LIMIT;
  const visibleTags = isExpanded ? tags : tags.slice(0, TAG_PREVIEW_LIMIT);
  const handleTagClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    const tag = event.currentTarget.dataset.tag;
    if (tag) onTagClick(tag);
  };
  const handleToggle: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setIsExpanded((expanded) => !expanded);
  };
  const stopCardShortcut: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  };

  return (
    <footer className={cn(className, "tag-summary")}>
      {visibleTags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="neutral" size="sm" data-tag={tag} onPress={handleTagClick} onKeyDown={stopCardShortcut}>
          {tag}
        </Badge>
      ))}
      {hasHiddenTags ? (
        <Badge
          className="tag-summary-toggle"
          variant="neutral"
          size="sm"
          onPress={handleToggle}
          onKeyDown={stopCardShortcut}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "收起标签" : `展开其余 ${tags.length - TAG_PREVIEW_LIMIT} 个标签`}
        >
          {isExpanded ? "收起" : `+${tags.length - TAG_PREVIEW_LIMIT}`}
        </Badge>
      ) : null}
    </footer>
  );
}
