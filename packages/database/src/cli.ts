// Usage (Node 26 runs this TypeScript directly, no build step):
//   node src/cli.ts migrate              uses DATABASE_MIGRATION_URL (direct connection, never Hyperdrive)
//   node src/cli.ts migrate --local      uses the compose.yaml database, ignores the environment
//   node src/cli.ts dev-passwords        sets throwaway ts_app/ts_auth passwords (local hosts only)
import process from "node:process";
import { LOCAL_MIGRATION_URL, setLocalDevPasswords } from "./local.ts";
import { MigrationError, runMigrations } from "./migrator.ts";

function connectionString(local: boolean): string {
  if (local) return LOCAL_MIGRATION_URL;
  const url = process.env["DATABASE_MIGRATION_URL"];
  if (url === undefined || url === "") {
    throw new Error(
      "DATABASE_MIGRATION_URL is not set. For the local Docker database: cp .env.example .env (or pass --local).",
    );
  }
  return url;
}

async function main(args: string[]): Promise<void> {
  const [command, ...flags] = args;
  const local = flags.includes("--local");
  switch (command) {
    case "migrate": {
      const { applied } = await runMigrations({
        connectionString: connectionString(local),
        log: (message) => console.log(message),
      });
      console.log(`${applied.length} migration(s) applied.`);
      return;
    }
    case "dev-passwords": {
      const url = process.env["DATABASE_MIGRATION_URL"];
      await setLocalDevPasswords(local || url === undefined || url === "" ? LOCAL_MIGRATION_URL : url);
      console.log("Local throwaway passwords set for ts_app and ts_auth.");
      return;
    }
    default:
      throw new Error("Usage: cli.ts <migrate|dev-passwords> [--local]");
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  // Print the message and the database error only; connection strings are never logged.
  console.error(error instanceof Error ? error.message : error);
  if (error instanceof MigrationError && error.cause instanceof Error) {
    console.error(`  cause: ${error.cause.message}`);
  }
  process.exitCode = 1;
}
