import type { SavedItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { useEffect, useState } from "react";

export function CoverArt({ item, large = false }: { item: SavedItem; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [item.cover.image]);

  if (item.cover.image && !imageFailed) {
    return <img className={cn("cover-image", large && "cover-large")} src={item.cover.image} alt={`${item.title} 封面`} loading={large ? "eager" : "lazy"} decoding="async" onError={() => setImageFailed(true)} />;
  }
  return (
    <div
      className={cn("cover-art", `cover-${item.cover.motif}`, large && "cover-large")}
      style={{ backgroundColor: item.cover.background, color: item.cover.foreground }}
      aria-label={`${item.title} 的封面占位预览`}
      role="img"
    >
      <span>{item.cover.label}</span>
      <i aria-hidden="true" />
    </div>
  );
}
