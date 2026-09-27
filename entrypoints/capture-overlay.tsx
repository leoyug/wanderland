import React from "react";
import ReactDOM from "react-dom/client";
import tokensCss from "@/src/design-system/tokens.css?inline";
import { CapturePanel } from "@/src/features/capture/CapturePanel";
import panelCss from "@/src/features/capture/capture-panel.css?inline";
import { applyLanguagePreference, getAppLanguageSnapshot, normalizeLanguagePreference, subscribeLanguage } from "@/src/i18n/language";

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
    host.style.cssText = "all:initial!important;color-scheme:light!important;position:fixed!important;top:0!important;right:0!important;width:0!important;height:0!important;overflow:visible!important;z-index:2147483647!important;display:block!important;";
    host.dataset.theme = "light";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `${tokensCss.replaceAll(":root", ":host")}\n${panelCss}`;
    const container = document.createElement("div");
    container.className = "capture-overlay-root";
    shadow.append(style, container);
    (document.body ?? document.documentElement).append(host);

    const root = ReactDOM.createRoot(container);
    const unsubscribeLanguage = subscribeLanguage(() => { host.lang = getAppLanguageSnapshot(); });
    let resolveInitialLanguage: () => void = () => {};
    const initialLanguage = new Promise<void>((resolve) => { resolveInitialLanguage = resolve; });
    const languagePort = browser.runtime.connect({ name: "capture-language" });
    languagePort.onMessage.addListener((value: unknown) => {
      applyLanguagePreference(normalizeLanguagePreference(value));
      resolveInitialLanguage();
    });
    languagePort.onDisconnect.addListener(resolveInitialLanguage);
    const close = () => {
      unsubscribeLanguage();
      languagePort.disconnect();
      root.unmount();
      host.remove();
    };
    host.addEventListener(CLOSE_EVENT, close, { once: true });
    void initialLanguage.then(() => {
      if (host.isConnected) {
        host.lang = getAppLanguageSnapshot();
        root.render(<React.StrictMode><CapturePanel page={{ title: document.title, url: location.href }} onClose={close} /></React.StrictMode>);
      }
    });
  },
});
