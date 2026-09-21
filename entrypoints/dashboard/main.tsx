import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist-mono";
import "@/src/design-system/tokens.css";
import { ToastProvider } from "@/src/components/ui/Toast";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ToastProvider><App /></ToastProvider></React.StrictMode>,
);
