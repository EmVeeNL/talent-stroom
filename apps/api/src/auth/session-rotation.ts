import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

/**
 * Owner decision 1 (ADR 0006): changing the active organization rotates the session token.
 * Server-only endpoint (SERVER_ONLY: not routed over HTTP); our /v1 handlers call it through
 * `auth.api.rotateSessionForOrganization` AFTER they verified an active membership.
 *
 * 1. Delete the current session row first: the old token is dead even if a later step fails
 *    (fail closed: the user signs in again).
 * 2. Create a new session bound to the organization. `createdAt` and `expiresAt` are copied,
 *    so a switch neither makes a session "fresh" (freshAge gates sensitive actions) nor
 *    extends its lifetime. The sign-in method carries over for MFA policy checks.
 * 3. Set the new signed session cookie on the response.
 */
export const sessionRotation = () =>
  ({
    id: "talentstroom-session-rotation",
    endpoints: {
      rotateSessionForOrganization: createAuthEndpoint(
        "/talentstroom/rotate-session",
        {
          method: "POST",
          body: z.object({ organizationId: z.uuid() }),
          use: [sessionMiddleware],
          metadata: { SERVER_ONLY: true },
        },
        async (ctx) => {
          const { session, user } = ctx.context.session;
          const previous = session as typeof session & { authMethod?: string | null };
          const dontRememberMe = Boolean(
            await ctx.getSignedCookie(ctx.context.authCookies.dontRememberToken.name, ctx.context.secret),
          );
          await ctx.context.internalAdapter.deleteSession(session.token);
          const created = await ctx.context.internalAdapter.createSession(
            user.id,
            dontRememberMe,
            {
              activeOrganizationId: ctx.body.organizationId,
              authMethod: previous.authMethod ?? null,
              createdAt: session.createdAt,
              expiresAt: session.expiresAt,
            },
            true,
          );
          await setSessionCookie(ctx, { session: created, user }, dontRememberMe);
          return ctx.json({ sessionId: created.id });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
