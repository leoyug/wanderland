import React from "react";
import ReactDOM from "react-dom/client";
import tokensCss from "@/src/design-system/tokens.css?inline";
import { CapturePanel } from "@/src/features/capture/CapturePanel";
import panelCss from "@/src/features/capture/capture-panel.css?inline";

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
    style.textContent = `${tokensCss.replaceAll(":root", ":host")}\n${panelCss}`;
    const container = document.createElement("div");
    container.className = "capture-overlay-root";
    shadow.append(style, container);
    (document.body ?? document.documentElement).append(host);

    const root = ReactDOM.createRoot(container);
    const close = () => {
      root.unmount();
      host.remove();
    };
    host.addEventListener(CLOSE_EVENT, close, { once: true });
    root.render(<React.StrictMode><CapturePanel page={{ title: document.title, url: location.href }} onClose={close} /></React.StrictMode>);
  },
});
