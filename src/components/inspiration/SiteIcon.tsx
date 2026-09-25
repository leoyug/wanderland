import { RiGlobalLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import type { LibraryItem } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";
import { getSiteIconCandidates } from "@/src/lib/siteIcon";

interface SiteIconProps {
  item: Pick<LibraryItem, "siteIcon" | "url" | "siteIconAutoBackground" | "siteIconBackgroundOverride">;
  variant?: "mark" | "avatar";
  backgroundOverride?: "auto" | "light" | "dark";
}

export function SiteIcon({ item, variant = "mark", backgroundOverride }: SiteIconProps) {
  const candidates = useMemo(() => getSiteIconCandidates(item.siteIcon, item.url), [item.siteIcon, item.url]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => setCandidateIndex(0), [candidates]);

  const frameClassName = variant === "avatar" ? "follow-avatar" : "source-mark";
  const candidate = candidates[candidateIndex];
  const choice = backgroundOverride ?? item.siteIconBackgroundOverride ?? "auto";
  const background = choice === "auto"
    ? candidate === item.siteIcon ? item.siteIconAutoBackground : undefined
    : choice;
  if (candidate) {
    return <span className={cn(frameClassName, "site-icon-frame", background && `site-icon-background-${background}`)} aria-hidden="true"><img className="site-icon-image" src={candidate} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setCandidateIndex((index) => index + 1)} /></span>;
  }

  return <span className={cn(frameClassName, "site-icon-fallback")} aria-hidden="true"><RiGlobalLine size={variant === "avatar" ? 20 : 12} /></span>;
}
