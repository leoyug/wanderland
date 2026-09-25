import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist-mono";
import "@/src/design-system/tokens.css";
import "@/src/design-system/theme.css";
import { ToastProvider } from "@/src/components/ui/Toast";
import { initializeTheme } from "@/src/lib/themePreferences";
import { App } from "./App";

await initializeTheme();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ToastProvider><App /></ToastProvider></React.StrictMode>,
);
