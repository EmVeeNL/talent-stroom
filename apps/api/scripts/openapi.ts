import { writeFile } from "node:fs/promises";
import { app, openapiConfig } from "../src/app.ts";

// Sort object keys recursively; retain array order because it can be meaningful.
const document = app.getOpenAPI31Document(openapiConfig);
const json = JSON.stringify(
  document,
  (_key: string, value: unknown) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b, "en")));
    }
    return value;
  },
  2,
);
await writeFile(new URL("../openapi.json", import.meta.url), `${json}\n`);
