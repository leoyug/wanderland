import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { RiArrowLeftLine, RiArrowRightLine, RiArrowRightUpLine } from "@remixicon/react";
import { DigestCover } from "@/src/components/inspiration/DigestCover";
import { CoverArt } from "@/src/components/inspiration/CoverArt";
import { SiteIcon } from "@/src/components/inspiration/SiteIcon";
import { Badge } from "@/src/components/ui/Badge";
import { digestRepository } from "@/src/db/digestRepository";
import { digestRangeLabel, safeDigestUrl, type DigestEntry, type ContentDigest } from "@/src/domain/digest";
import { t, tf } from "@/src/i18n/ui";
import { DigestReadingRail } from "./DigestReadingRail";
import { digestEntryAnchor, jumpToDigestAnchor, type DigestReadingSection } from "./readingNavigation";
import { useDigestReadingPosition } from "./useDigestReadingPosition";

function DigestItem({ entry, showImage, anchorId }: { entry: DigestEntry; showImage: boolean; anchorId: string }) {
  const href = safeDigestUrl(entry.url);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  return <article className="digest-item">
    <div className="digest-item-source"><SiteIcon item={entry} variant={entry.kind === "follow" ? "avatar" : "mark"} /><span>{entry.siteHost}</span></div>
    <h3 id={anchorId} tabIndex={-1}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{entry.title}<RiArrowRightUpLine size={17} aria-hidden="true" /></a> : entry.title}</h3>
    {entry.description ? <p>{entry.description}</p> : null}
    {showImage && !imageUnavailable && (entry.cover.image || entry.cover.blob) ? <figure className="digest-item-image"><CoverArt item={entry} fit="contain" eager onUnavailable={() => setImageUnavailable(true)} /></figure> : null}
    {entry.tags.length ? <div className="digest-item-tags">{entry.tags.slice(0, 3).map((tag) => <Badge variant="neutral" size="sm" key={tag}>{tag}</Badge>)}</div> : null}
  </article>;
}

export function DigestReaderPage({ id, from }: { id: string; from?: string }) {
  const digest = useLiveQuery(async () => (await digestRepository.get(id)) ?? null, [id]);
  const editions = useLiveQuery<ContentDigest[]>(() => digest ? digestRepository.list(digest.kind) : Promise.resolve([]), [digest?.kind]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnUrl = from === "weekly" || from === "daily" ? `#settings/digest/${from}` : "#settings/digest";
  useEffect(() => {
    window.scrollTo(0, 0);
    if (digest) {
      titleRef.current?.focus({ preventScroll: true });
      void digestRepository.markRead(id).catch(() => undefined);
    }
  }, [id, digest?.id]);
  const sections = useMemo<DigestReadingSection[]>(() => digest ? [
    { id: "websites", label: "网站", entries: digest.entries.filter((entry) => entry.kind === "website") },
    { id: "articles", label: "文章", entries: digest.entries.filter((entry) => entry.kind === "article") },
    { id: "follows", label: "关注源", entries: digest.entries.filter((entry) => entry.kind === "follow") },
    { id: "retrospective", label: "过往收藏回顾", entries: digest.retrospective },
  ].filter((section) => section.entries.length) : [], [digest]);
  const readingPosition = useDigestReadingPosition(sections);
  const index = editions?.findIndex((edition) => edition.id === id) ?? -1;
  const newer = index > 0 ? editions?.[index - 1] : undefined;
  const older = index >= 0 ? editions?.[index + 1] : undefined;
  return <main className="digest-reader">
    <nav className="digest-reader-top" aria-label={t("简报导航")}><a className="button button-ghost" href={returnUrl}><RiArrowLeftLine size={16} aria-hidden="true" />{from === "weekly" || from === "daily" ? t("返回往期") : t("返回内容简报")}</a><span>WEBLOOM</span></nav>
    {digest === undefined ? <div className="digest-empty" role="status">{t("正在读取简报…")}</div> : digest === null ? <div className="digest-empty"><h1>{t("这份简报不存在")}</h1><p>{t("返回往期，选择其他简报继续阅读。")}</p></div> : <>
      <div className="digest-reader-cover"><DigestCover digest={digest} large /></div>
      {sections.length ? <DigestReadingRail sections={sections} activeSectionId={readingPosition.sectionId} activeAnchorId={readingPosition.anchorId} visible={readingPosition.visible} /> : null}
      <article className="digest-reader-body">
        <header className="digest-reader-header"><h1 ref={titleRef} tabIndex={-1}>{digest.title}</h1><div className="digest-reader-meta"><span>{t("作者")} Leo</span><span>{digestRangeLabel(digest)}</span><span>{digest.kind === "weekly" ? t("一周简报") : t("今日总结")}</span></div><p>{digest.introduction}</p></header>
        {sections.length ? <nav className="digest-reader-contents" aria-label={t("本期目录")}>{sections.map((section) => <a key={section.id} href={`#${section.id}`} onClick={(event) => { event.preventDefault(); jumpToDigestAnchor(section.id); }}>{t(section.label)}<span>{section.entries.length}</span></a>)}</nav> : null}
        {sections.map((section) => <section className="digest-section" key={section.id} aria-labelledby={section.id}><div className="digest-section-heading"><h2 id={section.id} tabIndex={-1}>{t(section.label)}</h2><span>{tf("{count} 条", { count: section.entries.length })}</span></div>{section.id === "retrospective" ? <p className="digest-section-note">{t("从过往收藏中挑出几条，换个时间，再看一次。")}</p> : null}<div>{section.entries.map((entry, itemIndex) => <DigestItem key={entry.id} entry={entry} anchorId={digestEntryAnchor(section.id, entry.id)} showImage={itemIndex === 0 || (section.id === "websites" && itemIndex === 3)} />)}</div></section>)}
        <footer className="digest-reader-footer"><p>{t("收藏是起点，重新发现也是。")}</p><span>Leo · WEBLOOM</span></footer>
        <nav className="digest-reader-editions" aria-label={t("其他简报")}>{older ? <a href={`#digest/${older.id}?from=${digest.kind}`}><RiArrowLeftLine size={17} aria-hidden="true" /><span>{t("上一期")}<strong>{older.title}</strong></span></a> : <span />}{newer ? <a href={`#digest/${newer.id}?from=${digest.kind}`}><span>{t("下一期")}<strong>{newer.title}</strong></span><RiArrowRightLine size={17} aria-hidden="true" /></a> : <a href={`#settings/digest/${digest.kind}`}>{t("返回往期")}<RiArrowRightLine size={17} aria-hidden="true" /></a>}</nav>
      </article>
    </>}
  </main>;
}
