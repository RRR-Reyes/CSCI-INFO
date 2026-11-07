import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/nunito";
import "@fontsource/assistant/300.css";
import "@fontsource/assistant/400.css";
import "@fontsource/assistant/600.css";
import "@fontsource/assistant/700.css";
import "@fontsource-variable/inter/opsz.css";
import "katex/dist/katex.min.css";

const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
