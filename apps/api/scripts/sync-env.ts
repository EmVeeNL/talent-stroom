// Keeps the git-ignored apps/api/.env in step with .env.example for local development:
// creates it when missing, appends keys that are missing (never overwrites existing values),
// and replaces the BETTER_AUTH_SECRET placeholder with a random local secret.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const examplePath = new URL("../.env.example", import.meta.url);
const envPath = new URL("../.env", import.meta.url);
const PLACEHOLDER_SECRET = /^BETTER_AUTH_SECRET=replace-with-/m;

const example = readFileSync(examplePath, "utf8");
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

const keysIn = (text: string) =>
  new Set(
    text
      .split("\n")
      .map((line) => /^([A-Z0-9_]+)=/.exec(line)?.[1])
      .filter((key): key is string => key !== undefined),
  );

const present = keysIn(env);
const missing = example.split("\n").filter((line) => {
  const key = /^([A-Z0-9_]+)=/.exec(line)?.[1];
  return key !== undefined && !present.has(key);
});

if (env === "") {
  env = example;
} else if (missing.length > 0) {
  env = `${env.replace(/\n*$/, "\n")}\n# Added from .env.example by sync-env\n${missing.join("\n")}\n`;
}

if (PLACEHOLDER_SECRET.test(env)) {
  env = env.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}`);
}

writeFileSync(envPath, env);
if (missing.length > 0) {
  console.log(`apps/api/.env: added ${missing.length} missing key(s) from .env.example`);
}
