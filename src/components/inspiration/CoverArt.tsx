import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { useEffect, useState } from "react";

export function CoverArt({ item, large = false, fit = "cover" }: { item: LibraryItem; large?: boolean; fit?: "cover" | "contain" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string>();
  useEffect(() => {
    setImageFailed(false);
    if (!item.cover.blob) { setBlobUrl(undefined); return; }
    const nextUrl = URL.createObjectURL(item.cover.blob);
    setBlobUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [item.cover.blob, item.cover.image]);

  const image = item.cover.image ?? blobUrl;
  if (image && !imageFailed) {
    return <img className={cn("cover-image", large && "cover-large", fit === "contain" && "cover-contain")} src={image} alt={`${item.title} 封面`} loading={large ? "eager" : "lazy"} decoding="async" onError={() => setImageFailed(true)} />;
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
