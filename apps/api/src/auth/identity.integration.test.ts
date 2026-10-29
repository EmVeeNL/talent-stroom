// BDD scenarios from #61 (signup, first workspace), #62 (organization selection) and #67
// (organization switch) against real Postgres with the shipped migrations, connected as the
// runtime roles ts_auth (HYPERDRIVE_AUTH) and ts_app (HYPERDRIVE). Synthetic data only.
import { z } from "@hono/zod-openapi";
import { MyOrganizationsResponse, OrganizationContext, PROBLEMS, ProblemDetails } from "@talentstroom/contracts";
import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiApp } from "../app.ts";
import { LogOnlyTransport } from "../mail/index.ts";
import { testEnv } from "../test-env.ts";
import {
  TEST_URL,
  createMigratedDatabase,
  localHyperdrive,
  testExecutionContext,
  type MigratedDatabase,
} from "../test-db.ts";
import { SESSION_COOKIE } from "./create-auth.ts";

// Imported first for its side effect of extending zod before contracts load.
void z;

const ORIGIN = "http://localhost:5173";
const PASSWORD = "synthetic password 0001";

const email = () => `user-${randomUUID()}@example.test`;
const problemType = (json: unknown) => ProblemDetails.parse(json).type;

describe.skipIf(TEST_URL === "")("identity integration (Postgres)", () => {
  let db: MigratedDatabase;
  let env: Env;
  const mail = new LogOnlyTransport(() => undefined);
  const app = createApiApp({ mailTransport: () => mail });

  beforeAll(async () => {
    db = await createMigratedDatabase();
    env = {
      ...testEnv,
      HYPERDRIVE: localHyperdrive(db.appUrl),
      HYPERDRIVE_AUTH: localHyperdrive(db.authUrl),
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      BETTER_AUTH_URL: ORIGIN,
    };
  }, 60_000);

  afterAll(async () => {
    await db?.drop();
  });

  /** One HTTP call through the full app; waits for waitUntil work (mail, pool close). */
  async function call(
    method: string,
    path: string,
    options: { cookie?: string; body?: unknown; headers?: Record<string, string> } = {},
  ) {
    const { ctx, settle } = testExecutionContext();
    const headers: Record<string, string> = {
      Origin: ORIGIN,
      // Better Auth's own limiter (3 sign-ins per 10 s per IP) must not couple test cases.
      "CF-Connecting-IP": `198.51.100.${Math.floor(Math.random() * 250) + 1}`,
      ...options.headers,
    };
    if (options.cookie) headers["Cookie"] = `${SESSION_COOKIE}=${options.cookie}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    const init: RequestInit = { method, headers };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    const res = await app.request(path, init, env, ctx);
    const text = await res.text();
    await settle();
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0] ?? "")
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
      ?.slice(SESSION_COOKIE.length + 1);
    const json = res.headers.get("Content-Type")?.includes("json") && text ? (JSON.parse(text) as unknown) : undefined;
    return { status: res.status, json, cookie, res };
  }

  function linkFromLastMail(to: string, template: "verify-email" | "reset-password"): URL {
    const message = mail.sent.findLast((m) => m.to === to && m.template === template);
    const match = message?.text.match(/https?:\/\/\S+/);
    if (!match) throw new Error(`no ${template} mail`);
    return new URL(match[0]);
  }

  async function signUp(address: string) {
    const res = await call("POST", "/api/auth/sign-up/email", {
      body: { email: address, password: PASSWORD, name: "Synthetic User" },
    });
    expect(res.status).toBe(200);
  }

  async function verify(address: string) {
    const link = linkFromLastMail(address, "verify-email");
    expect(link.origin).toBe(ORIGIN);
    expect(link.pathname).toBe("/api/auth/verify-email");
    const res = await call("GET", `${link.pathname}${link.search}`);
    expect([200, 302]).toContain(res.status);
  }

  async function signIn(address: string): Promise<string> {
    const res = await call("POST", "/api/auth/sign-in/email", { body: { email: address, password: PASSWORD } });
    expect(res.status).toBe(200);
    expect(res.cookie).toBeTruthy();
    return res.cookie ?? "";
  }

  /** Signed-up, verified and signed-in user. */
  async function verifiedUser() {
    const address = email();
    await signUp(address);
    await verify(address);
    return { address, cookie: await signIn(address) };
  }

  async function createOrganization(cookie: string, name: string) {
    const res = await call("POST", "/v1/organizations", { cookie, body: { name } });
    expect(res.status).toBe(201);
    return { context: OrganizationContext.parse(res.json), cookie: res.cookie ?? "" };
  }

  const userId = async (address: string) =>
    (await db.sql<{ id: string }>("SELECT id FROM auth.users WHERE email = $1", [address]))[0]?.id ?? "";

  describe("Feature: Signup and first workspace (#61)", () => {
    it("Scenario: Verified signup creates an organization with me as owner", async () => {
      // Given I registered with a new email address
      const address = email();
      await signUp(address);
      expect(mail.sent.findLast((m) => m.to === address)?.subject).toBe("Bevestig je e-mailadres voor TalentStroom");
      // When I verify my email
      await verify(address);
      const cookie = await signIn(address);
      // And I create organization "Bureau A"
      const created = await call("POST", "/v1/organizations", { cookie, body: { name: "Bureau A" } });
      expect(created.status).toBe(201);
      const context = OrganizationContext.parse(created.json);
      // Then I am the owner of "Bureau A"
      expect(context).toMatchObject({ name: "Bureau A", role: "owner" });
      const rows = await db.sql<{ role: string; state: string }>(
        "SELECT role, state FROM app.memberships WHERE organization_id = $1 AND user_id = $2",
        [context.organizationId, await userId(address)],
      );
      expect(rows).toEqual([{ role: "owner", state: "active" }]);
      // And an audit event "organization.created" is recorded
      const events = await db.sql<{ event_type: string }>(
        "SELECT event_type FROM auth.auth_security_events WHERE organization_id = $1 ORDER BY occurred_at",
        [context.organizationId],
      );
      expect(events.map((e) => e.event_type)).toContain("organization.created");
      // Creating rotated the session into the new organization; the old token is dead.
      expect(created.cookie).toBeTruthy();
      expect(created.cookie).not.toBe(cookie);
      expect((await call("GET", "/v1/me/organizations", { cookie })).status).toBe(401);
      const current = await call("GET", "/v1/organizations/current", { cookie: created.cookie ?? "" });
      expect(current.status).toBe(200);
      expect(current.json).toEqual(context);
    });

    it("Scenario: Unverified account cannot access tenant data", async () => {
      // Given I registered but did not verify my email
      const address = email();
      await signUp(address);
      // Sign-in is refused, so no session exists.
      const refused = await call("POST", "/api/auth/sign-in/email", { body: { email: address, password: PASSWORD } });
      expect(refused.status).toBe(403);
      expect(refused.cookie).toBeUndefined();
      // When I request any organization endpoint
      const responses = await Promise.all(
        (
          [
            ["GET", "/v1/me/organizations"],
            ["GET", "/v1/organizations/current"],
            ["POST", "/v1/organizations"],
            ["POST", `/v1/organizations/${randomUUID()}/switch`],
          ] as const
        ).map(async ([method, path]) => call(method, path, method === "POST" ? { body: { name: "Bureau X" } } : {})),
      );
      // Then the API refuses access
      expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401]);
    });

    it("Scenario: a session whose email is no longer verified is refused", async () => {
      const { address, cookie } = await verifiedUser();
      const { cookie: orgCookie } = await createOrganization(cookie, "Bureau Unverified");
      await db.sql("UPDATE auth.users SET email_verified = false WHERE email = $1", [address]);
      const responses = await Promise.all(
        ["/v1/me/organizations", "/v1/organizations/current"].map(async (path) =>
          call("GET", path, { cookie: orgCookie }),
        ),
      );
      for (const res of responses) {
        expect(res.status).toBe(403);
        expect(problemType(res.json)).toBe(PROBLEMS.forbidden.type);
      }
    });
  });

  describe("Feature: Organization selection and switch (#62, #67)", () => {
    it("Scenario: two memberships → list → switch → old token rejected → new token works", async () => {
      const { address, cookie } = await verifiedUser();
      const a = await createOrganization(cookie, "Bureau A");
      const b = await createOrganization(a.cookie, "Bureau B");

      // "Kies je organisatie": both active memberships, B currently active.
      const list = await call("GET", "/v1/me/organizations", { cookie: b.cookie });
      expect(list.status).toBe(200);
      const body = MyOrganizationsResponse.parse(list.json);
      expect(body.activeOrganizationId).toBe(b.context.organizationId);
      expect(body.organizations.map((o) => o.name)).toEqual(["Bureau A", "Bureau B"]);

      const [before] = await db.sql<{ created_at: Date; expires_at: Date }>(
        "SELECT created_at, expires_at FROM auth.sessions WHERE user_id = $1",
        [await userId(address)],
      );

      // When I switch to "Bureau A"
      const switched = await call("POST", `/v1/organizations/${a.context.organizationId}/switch`, {
        cookie: b.cookie,
      });
      expect(switched.status).toBe(200);
      expect(switched.json).toEqual(a.context);
      // Then my session context is rotated: a new token, the old one is rejected
      expect(switched.cookie).toBeTruthy();
      expect(switched.cookie).not.toBe(b.cookie);
      expect((await call("GET", "/v1/organizations/current", { cookie: b.cookie })).status).toBe(401);
      expect((await call("GET", "/v1/me/organizations", { cookie: b.cookie })).status).toBe(401);
      const current = await call("GET", "/v1/organizations/current", { cookie: switched.cookie ?? "" });
      expect(current.status).toBe(200);
      expect(current.json).toEqual(a.context);

      // Exactly one session remains; rotation neither refreshed nor extended it.
      const sessions = await db.sql<{ created_at: Date; expires_at: Date; active_organization_id: string }>(
        "SELECT created_at, expires_at, active_organization_id FROM auth.sessions WHERE user_id = $1",
        [await userId(address)],
      );
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.active_organization_id).toBe(a.context.organizationId);
      expect(sessions[0]?.created_at).toEqual(before?.created_at);
      expect(sessions[0]?.expires_at).toEqual(before?.expires_at);
      const events = await db.sql<{ event_type: string }>(
        "SELECT event_type FROM auth.auth_security_events WHERE organization_id = $1",
        [a.context.organizationId],
      );
      expect(events.map((e) => e.event_type)).toContain("organization.switched");
    });

    it("Scenario: Header alone cannot change organization", async () => {
      const { cookie } = await verifiedUser();
      const a = await createOrganization(cookie, "Bureau A");
      const b = await createOrganization(a.cookie, "Bureau B");
      const inA = await call("POST", `/v1/organizations/${a.context.organizationId}/switch`, { cookie: b.cookie });
      const cookieA = inA.cookie ?? "";
      // Given I am active in "Bureau A"; When I send X-Organization-Id of "Bureau B" without switching
      const res = await call("GET", "/v1/organizations/current", {
        cookie: cookieA,
        headers: { "X-Organization-Id": b.context.organizationId },
      });
      // Then the API refuses access
      expect(res.status).toBe(409);
      expect(problemType(res.json)).toBe(PROBLEMS.organizationMismatch.type);
      // A matching header is fine, and the session still points at A.
      const ok = await call("GET", "/v1/organizations/current", {
        cookie: cookieA,
        headers: { "X-Organization-Id": a.context.organizationId },
      });
      expect(ok.status).toBe(200);
      expect(OrganizationContext.parse(ok.json).organizationId).toBe(a.context.organizationId);
    });

    it("cannot switch into an organization without a membership", async () => {
      const owner = await verifiedUser();
      const foreign = await createOrganization(owner.cookie, "Bureau Foreign");
      const other = await verifiedUser();
      const res = await call("POST", `/v1/organizations/${foreign.context.organizationId}/switch`, {
        cookie: other.cookie,
      });
      expect(res.status).toBe(403);
      expect(res.cookie).toBeUndefined();
      // The caller's session survives a refused switch.
      expect((await call("GET", "/v1/me/organizations", { cookie: other.cookie })).status).toBe(200);
      // Without an active organization, tenant routes are refused.
      expect((await call("GET", "/v1/organizations/current", { cookie: other.cookie })).status).toBe(403);
    });

    it("rejects a cross-origin switch even with a valid session", async () => {
      const { cookie } = await verifiedUser();
      const a = await createOrganization(cookie, "Bureau A");
      const res = await call("POST", `/v1/organizations/${a.context.organizationId}/switch`, {
        cookie: a.cookie,
        headers: { Origin: "https://evil.example" },
      });
      expect(res.status).toBe(403);
      expect((await call("GET", "/v1/organizations/current", { cookie: a.cookie })).status).toBe(200);
    });
  });

  describe("Feature: Removal and suspension (AUTH-03)", () => {
    it("Scenario: a suspended member is denied on the next request", async () => {
      const owner = await verifiedUser();
      const org = await createOrganization(owner.cookie, "Bureau Suspend");
      const member = await verifiedUser();
      // Membership added directly (the invitation UI is out of scope).
      await db.sql("INSERT INTO app.memberships (organization_id, user_id, role) VALUES ($1, $2, 'recruiter')", [
        org.context.organizationId,
        await userId(member.address),
      ]);
      const inOrg = await call("POST", `/v1/organizations/${org.context.organizationId}/switch`, {
        cookie: member.cookie,
      });
      expect(inOrg.status).toBe(200);
      const cookie = inOrg.cookie ?? "";
      expect((await call("GET", "/v1/organizations/current", { cookie })).status).toBe(200);

      await db.sql("UPDATE app.memberships SET state = 'suspended' WHERE organization_id = $1 AND user_id = $2", [
        org.context.organizationId,
        await userId(member.address),
      ]);

      expect((await call("GET", "/v1/organizations/current", { cookie })).status).toBe(403);
      expect((await call("POST", `/v1/organizations/${org.context.organizationId}/switch`, { cookie })).status).toBe(
        403,
      );
      const list = await call("GET", "/v1/me/organizations", { cookie });
      expect(list.json).toEqual({ activeOrganizationId: null, organizations: [] });
      // The owner is unaffected.
      expect((await call("GET", "/v1/organizations/current", { cookie: org.cookie })).status).toBe(200);
    });

    it("a suspended organization is denied on the next request", async () => {
      const owner = await verifiedUser();
      const org = await createOrganization(owner.cookie, "Bureau Paused");
      await db.sql("UPDATE app.organizations SET state = 'suspended' WHERE id = $1", [org.context.organizationId]);
      expect((await call("GET", "/v1/organizations/current", { cookie: org.cookie })).status).toBe(403);
    });

    it("Better Auth paths that delete or switch are not served over HTTP", async () => {
      const owner = await verifiedUser();
      const org = await createOrganization(owner.cookie, "Bureau Raw");
      const ownerId = await userId(owner.address);
      const attempts: [string, unknown][] = [
        ["/api/auth/organization/set-active", { organizationId: org.context.organizationId }],
        ["/api/auth/organization/remove-member", { memberIdOrEmail: owner.address }],
        ["/api/auth/organization/delete", { organizationId: org.context.organizationId }],
        ["/api/auth/organization/leave", { organizationId: org.context.organizationId }],
        ["/api/auth/organization/create", { name: "Bureau Raw 2", slug: `raw-${randomUUID()}` }],
        ["/api/auth/admin/impersonate-user", { userId: ownerId }],
      ];
      const responses = await Promise.all(
        attempts.map(async ([path, body]) => call("POST", path, { cookie: org.cookie, body })),
      );
      expect(responses.map((r) => r.status)).toEqual(attempts.map(() => 404));
      for (const res of responses) expect(problemType(res.json)).toBe(PROBLEMS.notFound.type);
      const rows = await db.sql("SELECT 1 FROM app.memberships WHERE organization_id = $1 AND state = 'active'", [
        org.context.organizationId,
      ]);
      expect(rows).toHaveLength(1);
    });
  });

  describe("Password reset", () => {
    it("revokes every session of the user", async () => {
      const { address, cookie } = await verifiedUser();
      const requested = await call("POST", "/api/auth/request-password-reset", {
        body: { email: address, redirectTo: "/reset" },
      });
      expect(requested.status).toBe(200);
      const link = linkFromLastMail(address, "reset-password");
      const token = link.pathname.split("/").at(-1) ?? "";
      const reset = await call("POST", "/api/auth/reset-password", {
        body: { token, newPassword: "another synthetic password" },
      });
      expect(reset.status).toBe(200);
      expect((await call("GET", "/v1/me/organizations", { cookie })).status).toBe(401);
    });
  });
});
