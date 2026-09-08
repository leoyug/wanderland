import { lazy, Suspense, useEffect, useState } from "react";
import { LibraryPage } from "@/src/features/library/LibraryPage";

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import("@/src/features/design-system/DesignSystemPage").then((module) => ({ default: module.DesignSystemPage })))
  : null;

export function App() {
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

  return <LibraryPage />;
}
