import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.visual.ts",
  globalSetup: "./visual/setup.ts",
  outputDir: "../../artifacts/playwright",
  workers: 1,
  retries: 0,
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:5178",
    browserName: "chromium",
    locale: "nl-NL",
    timezoneId: "Europe/Amsterdam",
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5178 --strictPort",
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    url: "http://127.0.0.1:5178",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
