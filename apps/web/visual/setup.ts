import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const output = fileURLToPath(new URL("../../../artifacts/visual/", import.meta.url));

// Run once per invocation, so a failed test's worker restart preserves partial captures.
export default async function setup() {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
}
