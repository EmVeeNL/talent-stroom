import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Local API runs via `wrangler dev` on :8787.
    proxy: { "/api": { target: "http://localhost:8787", rewrite: (path) => path.replace(/^\/api/, "") } },
  },
});
