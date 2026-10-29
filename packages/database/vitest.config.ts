import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one Postgres cluster (roles are cluster-wide): run files serially.
    fileParallelism: false,
    globalSetup: ["./test/global-setup.ts"],
  },
});
