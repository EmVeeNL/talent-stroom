import "@talentstroom/ui/fonts.css";
import "@talentstroom/ui/tokens.css";
import "@talentstroom/ui/components.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { MotionProvider } from "@talentstroom/ui";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <MotionProvider>
      <App />
    </MotionProvider>
  </StrictMode>,
);
