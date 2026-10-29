import process from "node:process";

export default function setup(): void {
  if ((process.env["DATABASE_TEST_URL"] ?? "") === "") {
    console.warn(
      "\n[database] DATABASE_TEST_URL is not set: Postgres integration tests are SKIPPED.\n" +
        "           Run `pnpm db:reset` and set DATABASE_TEST_URL (see .env.example) to run them.\n",
    );
  }
}
