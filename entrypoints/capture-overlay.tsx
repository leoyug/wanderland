import React from "react";
import ReactDOM from "react-dom/client";
import tokensCss from "@/src/design-system/tokens.css?inline";
import themeCss from "@/src/design-system/theme.css?inline";
import { CapturePanel } from "@/src/features/capture/CapturePanel";
import panelCss from "@/src/features/capture/capture-panel.css?inline";
import { readThemePreference, resolveTheme, THEME_PREFERENCE_KEY, type ThemePreference } from "@/src/lib/themePreferences";

const HOST_NAME = "wanderland-capture-overlay";
const CLOSE_EVENT = "wanderland:capture-overlay-close";

export default defineUnlistedScript({
  globalName: true,
  main() {
    const existing = document.querySelector(HOST_NAME);
    if (existing) {
      existing.dispatchEvent(new CustomEvent(CLOSE_EVENT));
      return;
    }

    const host = document.createElement(HOST_NAME);
    host.style.cssText = "all:initial!important;position:fixed!important;top:0!important;right:0!important;width:0!important;height:0!important;overflow:visible!important;z-index:2147483647!important;display:block!important;";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `${tokensCss.replaceAll(":root", ":host")}\n${themeCss.replace(/html\[data-theme=(?:["'])?dark(?:["'])?\]/g, ':host([data-theme="dark"])')}\n${panelCss}`;
    const container = document.createElement("div");
    container.className = "capture-overlay-root";
    shadow.append(style, container);
    (document.body ?? document.documentElement).append(host);

    let themePreference: ThemePreference = "system";
    const applyOverlayTheme = () => { host.dataset.theme = resolveTheme(themePreference, window.matchMedia("(prefers-color-scheme: dark)").matches); };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onStorageChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
      if (area === "local" && changes[THEME_PREFERENCE_KEY]) {
        const value = changes[THEME_PREFERENCE_KEY].newValue;
        themePreference = value === "dark" || value === "light" ? value : "system";
        applyOverlayTheme();
      }
    };
    media.addEventListener("change", applyOverlayTheme);
    browser.storage?.onChanged?.addListener(onStorageChanged);
    void readThemePreference().then((value) => { themePreference = value; applyOverlayTheme(); });

    const root = ReactDOM.createRoot(container);
    const close = () => {
      media.removeEventListener("change", applyOverlayTheme);
      browser.storage?.onChanged?.removeListener(onStorageChanged);
      root.unmount();
      host.remove();
    };
    host.addEventListener(CLOSE_EVENT, close, { once: true });
    root.render(<React.StrictMode><CapturePanel page={{ title: document.title, url: location.href }} onClose={close} /></React.StrictMode>);
  },
});
