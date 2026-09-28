import { useEffect, useMemo, useState } from "react";
import { digestEntryAnchor, type DigestReadingSection } from "./readingNavigation";

export function useDigestReadingPosition(sections: DigestReadingSection[]) {
  const markers = useMemo(() => sections.flatMap((section) => [
    { id: section.id, sectionId: section.id },
    ...section.entries.map((entry) => ({ id: digestEntryAnchor(section.id, entry.id), sectionId: section.id })),
  ]), [sections]);
  const [position, setPosition] = useState({ sectionId: "", anchorId: "", visible: false });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const readingLine = Math.min(128, window.innerHeight * 0.12);
      let current = markers[0];
      for (const marker of markers) {
        const target = document.getElementById(marker.id);
        if (target && target.getBoundingClientRect().top <= readingLine) current = marker;
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = markers.at(-1);
      const first = markers[0] ? document.getElementById(markers[0].id) : null;
      const visible = !!first && first.getBoundingClientRect().top <= window.innerHeight * 0.6;
      const next = { sectionId: current?.sectionId ?? "", anchorId: current?.id ?? "", visible };
      setPosition((previous) => previous.sectionId === next.sectionId && previous.anchorId === next.anchorId && previous.visible === next.visible ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const body = document.querySelector(".digest-reader-body");
    const observer = new ResizeObserver(schedule);
    if (body) observer.observe(body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [markers]);

  return position;
}
