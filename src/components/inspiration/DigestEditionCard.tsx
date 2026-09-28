import type { ContentDigest } from "@/src/domain/digest";
import { digestRangeLabel } from "@/src/domain/digest";
import { Card } from "@/src/components/ui/Card";
import { t, tf } from "@/src/i18n/ui";
import { DigestCover } from "./DigestCover";

export function DigestEditionCard({ digest, href, onOpen }: { digest: ContentDigest; href: string; onOpen?: () => void }) {
  return <Card className="digest-edition-card"><a href={href} onClick={onOpen} aria-label={`${digest.title} · ${digestRangeLabel(digest)}${!digest.readAt ? ` · ${t("未读")}` : ""}`}>
    <DigestCover digest={digest} />
    <div className="digest-edition-copy">
      <div className="digest-edition-date"><span>{digestRangeLabel(digest)}</span>{!digest.readAt ? <span className="digest-unread-dot" aria-hidden="true" /> : null}</div>
      <h2>{digest.title}</h2><p>{digest.introduction}</p>
      <span className="digest-edition-meta">Leo · {tf("{count} 条收藏", { count: digest.entries.length })}{digest.retrospective.length ? ` · ${tf("{count} 条回顾", { count: digest.retrospective.length })}` : ""}</span>
    </div>
  </a></Card>;
}
