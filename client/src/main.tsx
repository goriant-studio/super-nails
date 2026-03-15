import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./global.css";

const base = import.meta.env.BASE_URL;

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = new URL("sw.js", base.endsWith("/") ? base : `${base}/`).pathname;
    navigator.serviceWorker.register(swUrl, { scope: base }).catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
