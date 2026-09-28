import { tf } from "@/src/i18n/ui";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { useEffect, useState } from "react";

export function CoverArt({ item, large = false, fit = "cover", eager = false, onUnavailable }: { item: Pick<LibraryItem, "title" | "cover">; large?: boolean; fit?: "cover" | "contain"; eager?: boolean; onUnavailable?: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string>();
  useEffect(() => {
    setImageFailed(false);
    setLoadAttempt(0);
    if (!item.cover.blob) { setBlobUrl(undefined); return; }
    const nextUrl = URL.createObjectURL(item.cover.blob);
    setBlobUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [item.cover.blob, item.cover.image]);

  const image = item.cover.image ?? blobUrl;
  if (image && !imageFailed) {
    return <img key={`${image}:${loadAttempt}`} className={cn("cover-image", large && "cover-large", fit === "contain" && "cover-contain")} src={image} alt={tf("{title} 封面", { title: item.title })} loading={large || eager ? "eager" : "lazy"} decoding="async" onError={() => { if (loadAttempt === 0) setLoadAttempt(1); else { setImageFailed(true); onUnavailable?.(); } }} />;
  }
  return (
    <div
      className={cn("cover-art", `cover-${item.cover.motif}`, large && "cover-large")}
      style={{ backgroundColor: item.cover.background, color: item.cover.foreground }}
      aria-label={tf("{title} 的封面占位预览", { title: item.title })}
      role="img"
    >
      <span>{item.cover.label}</span>
      <i aria-hidden="true" />
    </div>
  );
}
