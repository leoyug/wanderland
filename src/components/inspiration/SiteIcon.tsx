import { RiGlobalLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/src/lib/cn";
import { getSiteIconCandidates } from "@/src/lib/siteIcon";

interface SiteIconProps {
  src?: string;
  pageUrl: string;
  variant?: "mark" | "avatar";
}

export function SiteIcon({ src, pageUrl, variant = "mark" }: SiteIconProps) {
  const candidates = useMemo(() => getSiteIconCandidates(src, pageUrl), [pageUrl, src]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => setCandidateIndex(0), [candidates]);

  const className = variant === "avatar" ? "follow-avatar" : "source-mark";
  const candidate = candidates[candidateIndex];
  if (candidate) {
    return <img className={className} src={candidate} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setCandidateIndex((index) => index + 1)} />;
  }

  return <span className={cn(className, "site-icon-fallback")} aria-hidden="true"><RiGlobalLine size={variant === "avatar" ? 20 : 12} /></span>;
}
