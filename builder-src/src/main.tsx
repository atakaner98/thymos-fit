import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initLocale } from "./i18n/locale";
import "./styles.css";

initLocale();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/builder">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
