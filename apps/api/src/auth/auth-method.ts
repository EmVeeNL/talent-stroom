import { getCurrentAdapter } from "@better-auth/core/context";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

/** Closed allowlist: missing, legacy and unrecognized methods fail closed. */
export function satisfiesMfa(authMethod: string | null | undefined): boolean {
  return (
    authMethod === "passkey" ||
    authMethod === "password+totp" ||
    authMethod === "social:google+totp" ||
    authMethod === "social:apple+totp" ||
    authMethod === "social:microsoft+totp"
  );
}

function withTotp(method: string | null | undefined): string | null {
  if (satisfiesMfa(method)) return method ?? null;
  if (method === "password" || method === "social:google" || method === "social:apple" || method === "social:microsoft")
    return `${method}+totp`;
  return null;
}

/** Derived only from successful server routes, never from caller-supplied session fields. */
export function signInMethod(path: string, provider: unknown): string | null {
  if (path === "/sign-in/email" || path === "/sign-up/email") return "password";
  if (path === "/passkey/verify-authentication") return "passkey";
  const social = path.startsWith("/callback/")
    ? path.slice("/callback/".length)
    : path === "/sign-in/social"
      ? provider
      : null;
  return social === "google" || social === "apple" || social === "microsoft" ? `social:${social}` : null;
}

/** Uses Better Auth's adapter so hooks share its transaction and single connection. */
export const sessionPolicy = () =>
  ({
    id: "talentstroom-session-policy",
    init() {
      return {
        options: {
          databaseHooks: {
            session: {
              create: {
                async before(session, ctx) {
                  if (!ctx) return { data: session };
                  // Rotation/enrolment overrides already contain the original method and organization.
                  const previous = session as typeof session & {
                    authMethod?: string | null;
                    activeOrganizationId?: string | null;
                  };
                  let authMethod = previous.authMethod ?? signInMethod(ctx.path ?? "", ctx.body?.provider);
                  if (ctx.path === "/two-factor/verify-totp") {
                    // Without an existing session, Better Auth's signed 2FA challenge follows password
                    // sign-in. It creates the session only after successful TOTP verification.
                    authMethod = withTotp(authMethod ?? (ctx.context.session ? null : "password"));
                  }
                  if (previous.activeOrganizationId) return { data: { ...session, authMethod } };
                  const adapter = await getCurrentAdapter(ctx.context.adapter);
                  // Page memberships rather than relying on the adapter's default limit (100).
                  // Stop as soon as two active organizations prove that selection is ambiguous.
                  const organizations: { id: string; settings: Record<string, unknown> }[] = [];
                  async function collectOrganizations(offset: number): Promise<void> {
                    const memberships = await adapter.findMany<{ organizationId: string }>({
                      model: "member",
                      where: [
                        { field: "userId", value: session.userId },
                        { field: "state", value: "active" },
                      ],
                      limit: 100,
                      offset,
                      sortBy: { field: "id", direction: "asc" },
                    });
                    if (memberships.length)
                      organizations.push(
                        ...(await adapter.findMany<{ id: string; settings: Record<string, unknown> }>({
                          model: "organization",
                          where: [
                            { field: "id", operator: "in", value: memberships.map((m) => m.organizationId) },
                            { field: "state", value: "active" },
                          ],
                          limit: 2,
                        })),
                      );
                    if (memberships.length === 100 && organizations.length < 2)
                      await collectOrganizations(offset + 100);
                  }
                  await collectOrganizations(0);
                  const only = organizations.length === 1 ? organizations[0] : undefined;
                  const activeOrganizationId =
                    only &&
                    (only.settings["requireMfa"] !== true || satisfiesMfa(authMethod)) &&
                    only.settings["requireExplicitSelection"] !== true
                      ? only.id
                      : null;
                  return { data: { ...session, authMethod, activeOrganizationId } };
                },
              },
            },
          },
        },
      };
    },
    hooks: {
      after: [
        {
          matcher: (ctx) => ctx.path === "/two-factor/verify-totp",
          handler: createAuthMiddleware(async (ctx) => {
            const result: unknown = ctx.context.returned;
            // Errors and failed verifications must never upgrade a session. Successful TOTP
            // returns a token; enrolment may replace the session, so prefer newSession.
            if (!result || typeof result !== "object" || !("token" in result) || typeof result.token !== "string")
              return;
            const current = ctx.context.newSession ?? ctx.context.session;
            if (!current) return;
            const session = current.session as typeof current.session & { authMethod?: string | null };
            const authMethod = withTotp(session.authMethod);
            if (authMethod) await ctx.context.internalAdapter.updateSession(session.token, { authMethod });
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;
