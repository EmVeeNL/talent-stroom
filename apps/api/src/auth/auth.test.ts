import { z } from "@hono/zod-openapi";
import { PROBLEMS, ProblemDetails } from "@talentstroom/contracts";
import { describe, expect, it } from "vitest";
import { createApiApp } from "../app.ts";
import { LogOnlyTransport } from "../mail/index.ts";
import { fakeRateLimit, testEnv } from "../test-env.ts";
import { DISABLED_PATHS, organizationSlug } from "./create-auth.ts";
import { isAuthAttempt } from "./routes.ts";
import { asyncStorageSeeded } from "./runtime.ts";

// Imported first for its side effect of extending zod before contracts load.
void z;

// Unit tests without a database: everything here must answer before the per-request
// Better Auth instance touches HYPERDRIVE_AUTH (testEnv makes any such access throw).
const app = createApiApp({ mailTransport: () => new LogOnlyTransport(() => undefined) });

describe("auth runtime", () => {
  it("seeds Better Auth's AsyncLocalStorage at module start-up (better-auth#10315)", () => {
    expect(asyncStorageSeeded()).toBe(true);
  });

  it("derives a URL-safe slug with a random suffix", () => {
    expect(organizationSlug("Bureau Ä & Zonen B.V.")).toMatch(/^bureau-a-zonen-b-v-[0-9a-f]{6}$/);
    expect(organizationSlug("!!!")).toMatch(/^org-[0-9a-f]{6}$/);
    expect(organizationSlug("x".repeat(200)).length).toBeLessThanOrEqual(47);
  });

  it("never serves organization deletion, raw switching or operator escalation over HTTP", () => {
    for (const path of [
      "/organization/set-active",
      "/organization/delete",
      "/organization/remove-member",
      "/organization/leave",
      "/admin/impersonate-user",
      "/admin/set-user-password",
      "/admin/set-role",
      "/admin/create-user",
    ]) {
      expect(DISABLED_PATHS).toContain(path);
    }
    expect(DISABLED_PATHS).not.toContain("/admin/ban-user");
    expect(DISABLED_PATHS).not.toContain("/admin/revoke-user-sessions");
  });
});

describe("auth attempt rate limit", () => {
  it("covers sign-in, sign-up, password reset and 2FA verification", () => {
    expect(isAuthAttempt("POST", "/sign-in/email")).toBe(true);
    expect(isAuthAttempt("POST", "/sign-up/email")).toBe(true);
    expect(isAuthAttempt("POST", "/request-password-reset")).toBe(true);
    expect(isAuthAttempt("POST", "/reset-password")).toBe(true);
    expect(isAuthAttempt("POST", "/two-factor/verify-totp")).toBe(true);
    expect(isAuthAttempt("GET", "/get-session")).toBe(false);
    expect(isAuthAttempt("POST", "/sign-out")).toBe(false);
  });

  it("rejects with 429 before Better Auth runs", async () => {
    const limiter = fakeRateLimit("limit");
    const res = await app.request(
      "/api/auth/sign-in/email",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      { ...testEnv, RATE_LIMIT_AUTH_ATTEMPT: limiter },
    );
    expect(res.status).toBe(429);
    expect(limiter.keys).toEqual(["RATE_LIMIT_AUTH_ATTEMPT:no-ip"]);
  });

  it("fails closed when the binding errors", async () => {
    const res = await app.request(
      "/api/auth/request-password-reset",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      { ...testEnv, RATE_LIMIT_AUTH_ATTEMPT: fakeRateLimit("throw") },
    );
    expect(res.status).toBe(429);
  });
});

describe("/v1 identity routes", () => {
  it("reject unsafe cross-origin requests before any session lookup", async () => {
    const responses = await Promise.all(
      [undefined, "https://evil.example", "http://localhost:5174"].map(async (origin) =>
        app.request(
          "/v1/organizations",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
            body: JSON.stringify({ name: "Bureau A" }),
          },
          testEnv,
        ),
      ),
    );
    for (const res of responses) expect(res.status).toBe(403);
    const problems = await Promise.all(responses.map(async (res) => ProblemDetails.parse(await res.json())));
    for (const body of problems) expect(body.type).toBe(PROBLEMS.forbidden.type);
  });
});
