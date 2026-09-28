import { lazy, Suspense, useEffect, useState } from "react";
import { LibraryPage } from "@/src/features/library/LibraryPage";
import { SettingsPage } from "@/src/features/settings/SettingsPage";
import { DigestReaderPage } from "@/src/features/digest/DigestReaderPage";
import { digestRepository } from "@/src/db/digestRepository";
import { useDigestDate } from "@/src/features/digest/useDigestDate";
import "@/src/features/digest/digest.css";
import { useAppLanguage } from "@/src/i18n/useLanguage";

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import("@/src/features/design-system/DesignSystemPage").then((module) => ({ default: module.DesignSystemPage })))
  : null;

export function App() {
  useAppLanguage();
  const digestDate = useDigestDate();
  useEffect(() => { void digestRepository.ensureWeeklyDigests().catch(() => undefined); }, [digestDate]);
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openLibrary = () => { window.location.hash = ""; };

  if (DesignSystemPage && route === "#design-system") {
    return <Suspense fallback={null}><DesignSystemPage onBack={openLibrary} /></Suspense>;
  }

  if (route.startsWith("#digest/")) {
    const [path, query] = route.slice(8).split("?");
    return <DigestReaderPage id={path ?? ""} from={new URLSearchParams(query).get("from") ?? undefined} />;
  }

  if (route === "#settings" || route.startsWith("#settings/digest")) {
    const history = route.endsWith("/weekly") ? "weekly" : route.endsWith("/daily") ? "daily" : undefined;
    return <SettingsPage onBackToLibrary={openLibrary} initialSection={route === "#settings" ? "appearance" : "digest"} digestHistory={history} />;
  }

  return <LibraryPage />;
}
