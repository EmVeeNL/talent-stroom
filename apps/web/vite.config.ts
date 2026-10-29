import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, normalizePath } from "vite";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "icon-font-preload",
      apply: "serve",
      // The HTML URL is outside Vite's root. Match CSS's /@fs URL in dev;
      // production keeps Vite's normal hashed asset handling.
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const font = "../../packages/ui/fonts/material-symbols/MaterialSymbolsRounded.woff2";
          const path = normalizePath(fileURLToPath(new URL(font, import.meta.url)));
          return html.replace(font, `/@fs/${path.replace(/^\//, "")}`);
        },
      },
    },
  ],
  server: {
    port: 5173,
    // Local API runs via `wrangler dev` on :8787. First match wins:
    // /api/auth/* keeps its prefix (Better Auth's base path, so links and cookies match);
    // every other /api/* is stripped (/api/v1/... -> /v1/..., /api/health -> /health).
    proxy: {
      "/api/auth": { target: "http://localhost:8787" },
      "/api": { target: "http://localhost:8787", rewrite: (path) => path.replace(/^\/api/, "") },
    },
  },
});
