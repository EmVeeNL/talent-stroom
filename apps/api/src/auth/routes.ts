import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CreateOrganizationRequest,
  InvitationIdParam,
  MyOrganizationsResponse,
  OrganizationContext,
  OrganizationIdParam,
  ProblemDetails,
} from "@talentstroom/contracts";
import { createDatabase, withTenant } from "@talentstroom/database/tenant";
import { isAPIError } from "better-auth/api";
import type { Context, MiddlewareHandler } from "hono";
import { problem, type AppEnv } from "../problem.ts";
import { authAttemptLimit } from "../rate-limit.ts";
import { satisfiesMfa } from "./auth-method.ts";
import { AUTH_BASE_PATH, SESSION_COOKIE, organizationSlug } from "./create-auth.ts";
import { acceptInvitation } from "./invitations.ts";
import {
  findActiveMembership,
  identity,
  requireMembership,
  requireSession,
  sameOriginForUnsafeMethods,
  waitUntil,
  type IdentityDeps,
  type VerifiedMembership,
} from "./middleware.ts";

/** Better Auth routes (relative to AUTH_BASE_PATH) that count as authentication attempts. */
export function isAuthAttempt(method: string, authPath: string): boolean {
  if (method !== "POST") return false;
  return (
    authPath.startsWith("/sign-in/") ||
    authPath.startsWith("/sign-up/") ||
    authPath === "/request-password-reset" ||
    authPath === "/reset-password" ||
    authPath.startsWith("/two-factor/verify-")
  );
}

const authAttempts: MiddlewareHandler<AppEnv> = async (c, next) =>
  isAuthAttempt(c.req.method, c.req.path.slice(AUTH_BASE_PATH.length)) ? authAttemptLimit(c, next) : next();

const xRequestId = z.object({ "X-Request-Id": z.string() });
const setCookie = z.object({
  "X-Request-Id": z.string(),
  "Set-Cookie": z.string().openapi({ description: "The rotated session cookie (HttpOnly, SameSite=Lax)" }),
});
const sessionCookie = [{ sessionCookie: [] }];
const errors = {
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  429: { $ref: "#/components/responses/TooManyRequests" },
  500: { $ref: "#/components/responses/InternalError" },
} as const;

async function securityEvent(
  c: Context<AppEnv>,
  eventType: "organization.created" | "organization.switched",
  organizationId: string,
): Promise<void> {
  await c
    .get("identity")
    .db.insertInto("auth.auth_security_events")
    .values({ user_id: c.get("principal").userId, organization_id: organizationId, event_type: eventType })
    .execute();
}

/**
 * Rotates the session token and binds the new session to `membership`'s organization
 * (owner decision 1). The caller must have verified the membership on this request.
 */
async function rotateInto(c: Context<AppEnv>, membership: VerifiedMembership) {
  const { headers } = await c.get("identity").auth.api.rotateSessionForOrganization({
    headers: c.req.raw.headers,
    body: { organizationId: membership.organizationId },
    returnHeaders: true,
  });
  for (const cookie of headers.getSetCookie()) c.header("Set-Cookie", cookie, { append: true });
  return OrganizationContext.parse({
    organizationId: membership.organizationId,
    membershipId: membership.membershipId,
    name: membership.organizationName,
    role: membership.role,
  });
}

export function registerIdentity(app: OpenAPIHono<AppEnv>, deps: IdentityDeps): void {
  app.openAPIRegistry.registerComponent("securitySchemes", "sessionCookie", {
    type: "apiKey",
    in: "cookie",
    name: SESSION_COOKIE,
    description: `Better Auth session cookie, set by ${AUTH_BASE_PATH}/sign-in/*. Named __Secure-${SESSION_COOKIE} on HTTPS origins.`,
  });
  for (const [name, description] of [
    ["Unauthorized", "No valid session"],
    [
      "Forbidden",
      "Email not verified, account banned, cross-origin request, no active membership, or MFA required (mfa-required)",
    ],
    ["OrganizationMismatch", "X-Organization-Id differs from the session's active organization"],
  ] as const) {
    app.openAPIRegistry.registerComponent("responses", name, {
      description,
      headers: { "X-Request-Id": { schema: { type: "string" }, description: "Request correlation ID" } },
      content: { "application/problem+json": { schema: { $ref: "#/components/schemas/ProblemDetails" } } },
    });
  }

  // Better Auth (sign-up, sign-in, verification, reset, 2FA, invitations). Not in OpenAPI.
  app.use(`${AUTH_BASE_PATH}/*`, authAttempts, identity(deps));
  app.on(["GET", "POST"], `${AUTH_BASE_PATH}/*`, async (c) => {
    const res = await c.get("identity").auth.handler(c.req.raw);
    // Unknown and disabled paths answer Better Auth's plain "Not Found"; use our problem shape.
    if (res.status === 404 && !res.headers.get("Content-Type")?.includes("json")) return problem(c, "notFound");
    return res;
  });

  const v1 = [sameOriginForUnsafeMethods, identity(deps), requireSession] as const;
  app.use("/v1/me/*", ...v1);
  app.use("/v1/invitations/*", ...v1);
  app.use("/v1/organizations", ...v1);
  app.use("/v1/organizations/*", ...v1);
  app.use("/v1/organizations/current", requireMembership);

  app.openapi(
    createRoute({
      method: "get",
      path: "/v1/me/organizations",
      operationId: "listMyOrganizations",
      summary: "Active memberships of the signed-in user (Kies je organisatie)",
      security: sessionCookie,
      responses: {
        200: {
          description: "Active memberships in active organizations",
          headers: xRequestId,
          content: { "application/json": { schema: MyOrganizationsResponse } },
        },
        ...errors,
      },
    }),
    async (c) => {
      const principal = c.get("principal");
      const rows = await c
        .get("identity")
        .db.selectFrom("app.memberships as m")
        .innerJoin("app.organizations as o", "o.id", "m.organization_id")
        .select(["m.organization_id as organizationId", "m.id as membershipId", "o.name", "o.slug", "m.role"])
        .where("m.user_id", "=", principal.userId)
        .where("m.state", "=", "active")
        .where("o.state", "=", "active")
        .orderBy("o.name")
        .orderBy("o.id")
        .execute();
      const activeOrganizationId = rows.some((r) => r.organizationId === principal.activeOrganizationId)
        ? principal.activeOrganizationId
        : null;
      return c.json(MyOrganizationsResponse.parse({ activeOrganizationId, organizations: rows }), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/v1/organizations",
      operationId: "createOrganization",
      summary: "Create an organization; the creator becomes owner and the session rotates into it",
      security: sessionCookie,
      request: {
        body: { required: true, content: { "application/json": { schema: CreateOrganizationRequest } } },
      },
      responses: {
        201: {
          description: "Created. The response sets a new session cookie bound to the organization.",
          headers: setCookie,
          content: { "application/json": { schema: OrganizationContext } },
        },
        ...errors,
        422: { $ref: "#/components/responses/ValidationError" },
      },
    }),
    async (c) => {
      const { auth, db } = c.get("identity");
      const { name } = c.req.valid("json");
      let created;
      try {
        created = await auth.api.createOrganization({
          headers: c.req.raw.headers,
          body: { name, slug: organizationSlug(name), keepCurrentActiveOrganization: true },
        });
      } catch (error) {
        // Better Auth refuses (e.g. organization limit, not allowed): no details to the client.
        if (isAPIError(error) && error.statusCode < 500) return problem(c, "forbidden");
        throw error;
      }
      const membership = created ? await findActiveMembership(db, c.get("principal").userId, created.id) : undefined;
      if (membership === undefined) return problem(c, "internalError");
      await securityEvent(c, "organization.created", membership.organizationId);
      return c.json(await rotateInto(c, membership), 201);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/v1/organizations/{orgId}/switch",
      operationId: "switchOrganization",
      summary: "Make an organization active; revokes the current session and issues a new one",
      description:
        "Verifies an active membership, deletes the current session and sets a new session cookie bound " +
        "to the organization. Clients must abort in-flight requests and drop all cached data of the " +
        "previous organization.",
      security: sessionCookie,
      request: { params: OrganizationIdParam },
      responses: {
        200: {
          description: "Switched. The response sets a new session cookie; the previous one is revoked.",
          headers: setCookie,
          content: { "application/json": { schema: OrganizationContext } },
        },
        ...errors,
        422: { $ref: "#/components/responses/ValidationError" },
      },
    }),
    async (c) => {
      const { orgId } = c.req.valid("param");
      const membership = await findActiveMembership(c.get("identity").db, c.get("principal").userId, orgId);
      if (membership === undefined) return problem(c, "forbidden");
      if (membership.settings["requireMfa"] === true && !satisfiesMfa(c.get("principal").authMethod))
        return problem(c, "mfaRequired");
      const context = await rotateInto(c, membership);
      await securityEvent(c, "organization.switched", membership.organizationId);
      return c.json(context, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/v1/invitations/{invitationId}/accept",
      operationId: "acceptInvitation",
      summary: "Accept an invitation and rotate the session into its organization",
      description:
        "Requires the recipient's verified email and an active organization. Membership, invitation " +
        "status and security event commit together before session rotation. Existing memberships, " +
        "including suspended memberships, are refused. Clients must drop previous organization caches.",
      security: sessionCookie,
      request: { params: InvitationIdParam },
      responses: {
        200: {
          description: "Accepted. A new session cookie replaces the revoked previous session.",
          headers: setCookie,
          content: { "application/json": { schema: OrganizationContext } },
        },
        ...errors,
        404: { $ref: "#/components/responses/NotFound" },
        409: {
          description: "Invitation no longer pending, or membership already exists (including suspended)",
          headers: xRequestId,
          content: { "application/problem+json": { schema: ProblemDetails } },
        },
        410: {
          description: "Invitation expired",
          headers: xRequestId,
          content: { "application/problem+json": { schema: ProblemDetails } },
        },
        422: { $ref: "#/components/responses/ValidationError" },
      },
    }),
    async (c) => {
      const result = await acceptInvitation(
        c.get("identity").db,
        c.get("principal").userId,
        c.req.valid("param").invitationId,
      );
      if ("error" in result) return problem(c, result.error);
      return c.json(await rotateInto(c, result.membership), 200);
    },
  );

  app.openapi(
    createRoute({
      method: "get",
      path: "/v1/organizations/current",
      operationId: "getCurrentOrganization",
      summary: "The session's verified organization context",
      security: sessionCookie,
      request: { headers: z.object({ "X-Organization-Id": z.uuid().optional() }) },
      responses: {
        200: {
          description: "Active organization and the caller's membership",
          headers: xRequestId,
          content: { "application/json": { schema: OrganizationContext } },
        },
        ...errors,
        409: { $ref: "#/components/responses/OrganizationMismatch" },
      },
    }),
    async (c) => {
      const membership = c.get("membership");
      // Tenant read through ts_app under RLS with the verified context (ADR 0007).
      const db = createDatabase<{ "app.organizations": { id: string; name: string } }>(
        c.env.HYPERDRIVE.connectionString,
      );
      try {
        const organization = await withTenant(db, c.get("tenant"), (trx) =>
          trx.selectFrom("app.organizations").select(["id", "name"]).executeTakeFirst(),
        );
        if (organization === undefined) return problem(c, "forbidden");
        return c.json(
          OrganizationContext.parse({
            organizationId: organization.id,
            membershipId: membership.membershipId,
            name: organization.name,
            role: membership.role,
          }),
          200,
        );
      } finally {
        waitUntil(c, db.close());
      }
    },
  );
}
