/* eslint-disable no-await-in-loop -- Seed statements run sequentially in one transaction and preserve FK order. */
import { hashPassword } from "better-auth/crypto";
import { Client } from "pg";

export const DEVELOPMENT_PASSWORD = "Welkom-bij-TalentStroom-1";

/** Accept only the known local development database, before opening a connection. */
export function assertLocalSeedTarget(connectionString: string): void {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(
      "Refusing to seed: DATABASE_MIGRATION_URL must target localhost/127.0.0.1 and database talentstroom.",
    );
  }
  const host = url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!(host === "127.0.0.1" || host === "localhost") || database !== "talentstroom") {
    throw new Error(
      "Refusing to seed: DATABASE_MIGRATION_URL must target localhost/127.0.0.1 and database talentstroom.",
    );
  }
}

const organizations = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Bureau Noord Recruitment", slug: "bureau-noord" },
  { id: "10000000-0000-4000-8000-000000000002", name: "TechTalent Utrecht", slug: "techtalent-utrecht" },
] as const;

const users = [
  { id: "20000000-0000-4000-8000-000000000001", email: "eigenaar@example.nl", name: "Sanne Voorbeeld" },
  { id: "20000000-0000-4000-8000-000000000002", email: "recruiter@example.nl", name: "Daan Fictief" },
  { id: "20000000-0000-4000-8000-000000000003", email: "viewer@example.nl", name: "Noor Demo" },
  { id: "20000000-0000-4000-8000-000000000004", email: "geschorst@example.nl", name: "Milan Test" },
] as const;

const memberships = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    org: organizations[0].id,
    user: users[0].id,
    role: "owner",
    state: "active",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    org: organizations[0].id,
    user: users[1].id,
    role: "recruiter",
    state: "active",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    org: organizations[0].id,
    user: users[3].id,
    role: "recruiter",
    state: "suspended",
  },
  {
    id: "30000000-0000-4000-8000-000000000004",
    org: organizations[1].id,
    user: users[1].id,
    role: "recruiter",
    state: "active",
  },
  {
    id: "30000000-0000-4000-8000-000000000005",
    org: organizations[1].id,
    user: users[2].id,
    role: "viewer",
    state: "active",
  },
] as const;

export async function seedDatabase(connectionString: string): Promise<void> {
  const client = new Client({ connectionString, application_name: "talentstroom-local-seed" });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const org of organizations) {
      await client.query(
        `INSERT INTO app.organizations (id, name, slug, locale, timezone, state)
         VALUES ($1, $2, $3, 'nl-NL', 'Europe/Amsterdam', 'active')
         ON CONFLICT (id) DO NOTHING`,
        [org.id, org.name, org.slug],
      );
    }
    for (const user of users) {
      await client.query(
        `INSERT INTO auth.users (id, email, email_verified, display_name)
         VALUES ($1, $2, true, $3) ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.name],
      );
    }
    for (const user of users) {
      const password = await hashPassword(DEVELOPMENT_PASSWORD);
      await client.query(
        `INSERT INTO auth.auth_accounts (id, user_id, provider_id, account_id, password)
         VALUES ($1, $2, 'credential', $4, $3)
         ON CONFLICT (provider_id, account_id) DO NOTHING`,
        [`40000000-0000-4000-8000-${String(users.indexOf(user) + 1).padStart(12, "0")}`, user.id, password, user.id],
      );
    }
    for (const member of memberships) {
      await client.query(
        `INSERT INTO app.memberships (id, organization_id, user_id, role, state)
         VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
        [member.id, member.org, member.user, member.role, member.state],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

if (import.meta.main) {
  const connectionString = process.env["DATABASE_MIGRATION_URL"];
  if (!connectionString) {
    console.error("Refusing to seed: DATABASE_MIGRATION_URL is not set. Copy .env.example to .env first.");
    process.exitCode = 1;
  } else {
    try {
      assertLocalSeedTarget(connectionString);
      await seedDatabase(connectionString);
      console.log("Seeded local TalentStroom development data.");
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Local database seed failed.");
      process.exitCode = 1;
    }
  }
}
