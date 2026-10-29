import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Postgres integration files run 0001_roles (cluster-wide role changes) in their scratch
    // databases; concurrent runs fail with "tuple concurrently updated". Run files serially.
    fileParallelism: false,
  },
});
