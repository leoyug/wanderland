import { useEffect, useState } from "react";
import type { ContentDigest } from "@/src/domain/digest";
import { CoverArt } from "./CoverArt";

/** The first edition uses real saved OG media; later AI covers share this same frame. */
export function DigestCover({ digest, large = false }: { digest: Pick<ContentDigest, "title" | "entries" | "retrospective">; large?: boolean }) {
  const lead = [...digest.entries, ...digest.retrospective].find((entry) => entry.cover.image || entry.cover.blob);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => setUnavailable(false), [lead?.id]);
  return <div className="digest-cover">{lead && !unavailable ? <CoverArt item={lead} large={large} onUnavailable={() => setUnavailable(true)} /> : <img src="/assets/covers/inspiration-growth.png" alt="" loading={large ? "eager" : "lazy"} />}</div>;
}
