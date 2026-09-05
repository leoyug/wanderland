import type { InspirationItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";

export function CoverArt({ item, large = false }: { item: InspirationItem; large?: boolean }) {
  if (item.cover.image) {
    return <img className={cn("cover-image", large && "cover-large")} src={item.cover.image} alt={`${item.title} 封面`} />;
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
