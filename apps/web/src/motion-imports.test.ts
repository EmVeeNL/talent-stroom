import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

describe("Motion package boundary", () => {
  it("keeps app code importing Motion through @talentstroom/ui", async () => {
    const files = await sourceFiles(join(process.cwd(), "src"));
    const violations = await Promise.all(files.map(async (file) => ({ file, source: await readFile(file, "utf8") })));
    expect(
      violations.filter(({ source }) => /from\s+["']motion(?:\/|["'])/.test(source)).map(({ file }) => file),
    ).toEqual([]);
  });
});
