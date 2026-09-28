import type { DigestEntry } from "@/src/domain/digest";

export interface DigestReadingSection {
  id: string;
  label: string;
  entries: DigestEntry[];
}

export function digestEntryAnchor(sectionId: string, entryId: string) {
  return `digest-${sectionId}-${entryId}`;
}

export function jumpToDigestAnchor(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
  target.focus({ preventScroll: true });
}
