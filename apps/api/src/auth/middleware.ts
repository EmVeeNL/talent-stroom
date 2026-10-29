import { TenantContext } from "@talentstroom/database/tenant";
import type { Context, MiddlewareHandler } from "hono";
import type { Kysely } from "kysely";
import type { MailTransport } from "../mail/index.ts";
import { problem, type AppEnv } from "../problem.ts";
import { satisfiesMfa } from "./auth-method.ts";
import { createAuth, type AuthEnv } from "./create-auth.ts";
import type { IdentityDatabase } from "./identity-db.ts";
import type { VerifiedMembership } from "./types.ts";

export type { MembershipRole, Principal, VerifiedMembership } from "./types.ts";

export interface IdentityDeps {
  /** Mail transport for this request's auth emails. */
  mailTransport: (env: AuthEnv) => MailTransport;
}

/** Runs `promise` after the response when the runtime offers it (tests may not). */
export function waitUntil(c: Context<AppEnv>, promise: Promise<unknown>): void {
  try {
    c.executionCtx.waitUntil(promise);
  } catch {
    void promise;
  }
}

/** Creates the request's Better Auth instance and closes its pool after the response. */
export function identity(deps: IdentityDeps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const env = c.env as AuthEnv;
    const handle = createAuth(env, { mail: deps.mailTransport(env), waitUntil: (p) => waitUntil(c, p) });
    c.set("identity", handle);
    try {
      await next();
    } finally {
      waitUntil(c, handle.close());
    }
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF guard for our cookie-authenticated /v1 routes (Better Auth checks its own routes):
 * unsafe methods must come from the app's own origin. SameSite=Lax is the first layer.
 */
export const sameOriginForUnsafeMethods: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) return next();
  const expected = new URL(c.env.BETTER_AUTH_URL).origin;
  const origin = c.req.header("Origin") ?? originOf(c.req.header("Referer"));
  if (origin !== expected) return problem(c, "forbidden");
  return next();
};

function originOf(url: string | undefined): string | undefined {
  if (url === undefined) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the session from the cookie on the uncached ts_auth connection (no cookie cache,
 * ADR 0006): 401 without a valid session, 403 for unverified or banned users.
 */
export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  const { auth } = c.get("identity");
  const { headers, response } = await auth.api.getSession({ headers: c.req.raw.headers, returnHeaders: true });
  // Sliding refresh or cookie cleanup from Better Auth. Appended before the handler runs, so
  // a cookie the handler sets (session rotation) comes later and wins.
  for (const cookie of headers.getSetCookie()) c.header("Set-Cookie", cookie, { append: true });
  if (response === null) return problem(c, "unauthorized");
  const { user } = response;
  if (!user.emailVerified || user.banned === true) return problem(c, "forbidden");
  c.set("principal", {
    userId: user.id,
    sessionId: response.session.id,
    authMethod: response.session.authMethod ?? null,
    activeOrganizationId: response.session.activeOrganizationId ?? null,
  });
  return next();
};

/** Active membership of `userId` in an active organization, or undefined. */
export async function findActiveMembership(
  db: Kysely<IdentityDatabase>,
  userId: string,
  organizationId: string,
): Promise<VerifiedMembership | undefined> {
  const row = await db
    .selectFrom("app.memberships as m")
    .innerJoin("app.organizations as o", "o.id", "m.organization_id")
    .select([
      "m.id as membershipId",
      "m.organization_id as organizationId",
      "m.role",
      "o.name as organizationName",
      "o.settings",
    ])
    .where("m.user_id", "=", userId)
    .where("m.organization_id", "=", organizationId)
    .where("m.state", "=", "active")
    .where("o.state", "=", "active")
    .executeTakeFirst();
  return row;
}

/**
 * For organization-scoped /v1 routes, after requireSession: the session's active
 * organization must have an active membership of this user (read on every request, so
 * suspension is effective immediately). Produces the TenantContext for withTenant.
 * `X-Organization-Id` never selects the tenant; a different value is a stale client → 409.
 */
export const requireMembership: MiddlewareHandler<AppEnv> = async (c, next) => {
  const principal = c.get("principal");
  if (principal.activeOrganizationId === null) return problem(c, "forbidden");
  const membership = await findActiveMembership(c.get("identity").db, principal.userId, principal.activeOrganizationId);
  if (membership === undefined) return problem(c, "forbidden");
  if (membership.settings["requireMfa"] === true && !satisfiesMfa(principal.authMethod))
    return problem(c, "mfaRequired");
  const claimed = c.req.header("X-Organization-Id");
  if (claimed !== undefined && claimed.toLowerCase() !== membership.organizationId.toLowerCase()) {
    return problem(c, "organizationMismatch");
  }
  c.set("membership", membership);
  c.set(
    "tenant",
    TenantContext.fromVerifiedMembership({
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
    }),
  );
  return next();
};
