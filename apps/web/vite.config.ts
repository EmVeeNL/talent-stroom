import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
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
