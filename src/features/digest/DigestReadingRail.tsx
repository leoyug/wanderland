import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { t, tf } from "@/src/i18n/ui";
import { digestEntryAnchor, jumpToDigestAnchor, type DigestReadingSection } from "./readingNavigation";

interface DigestReadingRailProps {
  sections: DigestReadingSection[];
  activeSectionId: string;
  activeAnchorId: string;
  visible: boolean;
  preview?: boolean;
}

export function DigestReadingRail({ sections, activeSectionId, activeAnchorId, visible, preview = false }: DigestReadingRailProps) {
  const entryCount = sections.reduce((count, section) => count + section.entries.length, 0);
  const markerCount = sections.length + entryCount;
  const naturalHeight = markerCount * 12 + 8;
  const rows = markerCount ? `repeat(${markerCount}, minmax(0, 1fr))` : undefined;

  return <nav className={`digest-reading-rail${preview ? " digest-reading-rail-preview" : ""}`} style={{ height: preview ? naturalHeight : `min(${naturalHeight}px, calc(100dvh - 64px))`, gridTemplateRows: rows }} aria-label={t("阅读位置与目录")} hidden={!visible}>
    {sections.map((section) => <div className="digest-reading-rail-group" key={section.id}>
      <Button variant="ghost" className={`digest-reading-marker digest-reading-section${activeSectionId === section.id ? " is-current-section" : ""}`} aria-current={activeAnchorId === section.id ? "location" : undefined} onPress={() => jumpToDigestAnchor(section.id)}>
        <span className="digest-reading-tick" aria-hidden="true" /><span title={t(section.label)}>{t(section.label)}</span>
      </Button>
      {section.entries.map((entry) => {
        const anchorId = digestEntryAnchor(section.id, entry.id);
        return <Tooltip key={entry.id} placement="right" content={entry.title}>
          <Button variant="ghost" className="digest-reading-marker digest-reading-entry" aria-label={tf("跳转到 {title}", { title: entry.title })} aria-current={activeAnchorId === anchorId ? "location" : undefined} onPress={() => jumpToDigestAnchor(anchorId)}>
            <span className="digest-reading-tick" aria-hidden="true" />
          </Button>
        </Tooltip>;
      })}
    </div>)}
  </nav>;
}
