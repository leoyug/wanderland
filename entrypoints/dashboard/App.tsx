import { useEffect, useState } from "react";
import { DesignSystemPage } from "@/src/features/design-system/DesignSystemPage";
import { LibraryPage } from "@/src/features/library/LibraryPage";

export function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openDesignSystem = () => { window.location.hash = "design-system"; };
  const openLibrary = () => { window.location.hash = ""; };

  if (import.meta.env.DEV && route === "#design-system") {
    return <DesignSystemPage onBack={openLibrary} />;
  }

  return <LibraryPage onOpenDesignSystem={openDesignSystem} />;
}
