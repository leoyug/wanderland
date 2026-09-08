import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/geist-mono";
import "@/src/design-system/tokens.css";
import "./style.css";
import { PopupApp } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><PopupApp /></React.StrictMode>,
);
