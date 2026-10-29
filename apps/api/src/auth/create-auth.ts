import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { mailLocale, renderMail, type MailMessage, type MailSettings, type MailTransport } from "../mail/index.ts";
import { organizationAc, organizationRoles, platformAc, platformRoles } from "./access-control.ts";
import type { IdentityDatabase } from "./identity-db.ts";
import { asyncStorageSeeded } from "./runtime.ts";
import { sessionRotation } from "./session-rotation.ts";

/** Optional settings (apps/api/.env locally, Workers secrets in production). */
export interface SocialSettings {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
}

export type AuthEnv = Pick<Env, "HYPERDRIVE_AUTH" | "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL"> &
  MailSettings &
  SocialSettings;

export interface AuthDeps {
  mail: MailTransport;
  /** Runs work after the response (ExecutionContext.waitUntil); used for mail only. */
  waitUntil: (promise: Promise<unknown>) => void;
  /** Runtime schema check. Off in the Worker (better-auth#11651); on in the CI schema test. */
  validateSchema?: boolean;
}

/** Better Auth routes are served at `${BETTER_AUTH_URL}${AUTH_BASE_PATH}/*`. */
export const AUTH_BASE_PATH = "/api/auth";

/** Session cookie name without the `__Secure-` prefix that HTTPS origins add. */
export const SESSION_COOKIE = "ts.session_token";

const DAY = 60 * 60 * 24;

/** Organization slugs are internal and unique; derived from the name plus a random suffix. */
export function organizationSlug(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${base || "org"}-${suffix}`;
}

function socialProviders(env: SocialSettings): NonNullable<BetterAuthOptions["socialProviders"]> {
  const providers: NonNullable<BetterAuthOptions["socialProviders"]> = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  }
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    // Microsoft's email claim is tenant-mutable: never trusted for account linking (ADR 0006).
    providers.microsoft = {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
      tenantId: "common",
    };
  }
  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    providers.apple = { clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET };
  }
  return providers;
}

// Raw Better Auth paths that are not served over HTTP (404). Server-side auth.api.* calls
// still work. Organization context changes and member removal go through our /v1 API;
// nothing may delete organizations or memberships (ADR 0012). Admin: ban and revoke only (D12).
export const DISABLED_PATHS = [
  "/organization/create",
  "/organization/set-active",
  "/organization/delete",
  "/organization/leave",
  "/organization/remove-member",
  "/admin/create-user",
  "/admin/get-user",
  "/admin/list-users",
  "/admin/update-user",
  "/admin/set-role",
  "/admin/set-user-password",
  "/admin/remove-user",
  "/admin/impersonate-user",
  "/admin/stop-impersonating",
  "/admin/list-user-sessions",
  "/admin/revoke-user-session",
  "/admin/has-permission",
];

/**
 * Builds a Better Auth instance and its `pg` pool for ONE request (ADR 0006: no instance,
 * pool or init promise may outlive its request on Workers). Call `close()` when done.
 */
export function createAuth(env: AuthEnv, deps: AuthDeps) {
  if (!asyncStorageSeeded()) throw new Error("Better Auth AsyncLocalStorage was not seeded at start-up");
  const pool = new Pool({ connectionString: env.HYPERDRIVE_AUTH.connectionString, max: 1 });
  // Idle client errors are emitted as events; without a listener they would crash the isolate.
  pool.on("error", () => undefined);

  const baseURL = new URL(env.BETTER_AUTH_URL).origin;
  const send = (message: MailMessage) =>
    deps.waitUntil(
      // Not awaited in the request (no timing side channel); never log the message.
      deps.mail.send(message).catch(() => {
        console.error(
          JSON.stringify({ message: "auth mail failed", template: message.template, transport: deps.mail.name }),
        );
      }),
    );

  const auth = betterAuth({
    appName: "TalentStroom",
    baseURL,
    basePath: AUTH_BASE_PATH,
    secret: env.BETTER_AUTH_SECRET,
    telemetry: { enabled: false },
    // Unqualified model names resolve to `auth`; `app.*` model names stay in `app` (ADR 0012).
    database: { dialect: new PostgresDialect({ pool }), type: "postgres", schemaName: "auth", transaction: true },
    advanced: {
      database: { generateId: "uuid", validateSchema: deps.validateSchema ?? false },
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: baseURL.startsWith("https://"),
      cookiePrefix: "ts",
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", path: "/" },
      // Explicit, so tests (NODE_ENV=test) run with the production CSRF/origin checks.
      disableCSRFCheck: false,
      disableOriginCheck: false,
    },
    user: {
      modelName: "users",
      fields: {
        name: "display_name",
        emailVerified: "email_verified",
        image: "image_url",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    session: {
      modelName: "sessions",
      fields: {
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
      freshAge: 60 * 15,
      // Sessions live only in Postgres: no cookie cache, no secondary storage (ADR 0006 rule 4).
      cookieCache: { enabled: false },
      additionalFields: {
        authMethod: { type: "string", required: false, input: false, fieldName: "auth_method" },
        lastSeenAt: { type: "date", required: false, input: false, fieldName: "last_seen_at" },
        lockedAt: { type: "date", required: false, input: false, fieldName: "locked_at" },
      },
    },
    account: {
      modelName: "auth_accounts",
      encryptOAuthTokens: true,
      accountLinking: { enabled: true, trustedProviders: ["google"] },
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "auth_verifications",
      storeIdentifier: "hashed",
      fields: { expiresAt: "expires_at", createdAt: "created_at", updatedAt: "updated_at" },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => {
        send(
          renderMail("reset-password", mailLocale(request?.headers.get("accept-language")), user.email, {
            url,
            name: user.name,
          }),
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }, request) => {
        send(
          renderMail("verify-email", mailLocale(request?.headers.get("accept-language")), user.email, {
            url,
            name: user.name,
          }),
        );
      },
    },
    socialProviders: socialProviders(env),
    ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET ? { trustedOrigins: ["https://appleid.apple.com"] } : {}),
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "auth_rate_limits",
      fields: { lastRequest: "last_request" },
    },
    disabledPaths: DISABLED_PATHS,
    plugins: [
      organization({
        ac: organizationAc,
        roles: organizationRoles,
        creatorRole: "owner",
        allowUserToCreateOrganization: (user) => user.emailVerified,
        invitationExpiresIn: 7 * DAY,
        requireEmailVerificationOnInvitation: true,
        cancelPendingInvitationsOnReInvite: true,
        disableOrganizationDeletion: true,
        sendInvitationEmail: async (data, request) => {
          send(
            renderMail("invitation", mailLocale(request?.headers.get("accept-language")), data.email, {
              url: `${baseURL}/invitations/${encodeURIComponent(data.id)}`,
              organization: data.organization.name,
              inviter: data.inviter.user.name,
            }),
          );
        },
        organizationHooks: {
          // Memberships are suspended through our /v1 API, never deleted (ADR 0012).
          beforeRemoveMember: async () => {
            throw new APIError("FORBIDDEN", { message: "Members are suspended, not removed" });
          },
        },
        schema: {
          organization: { modelName: "app.organizations", fields: { logo: "logo_url", createdAt: "created_at" } },
          member: {
            modelName: "app.memberships",
            fields: { organizationId: "organization_id", userId: "user_id", createdAt: "created_at" },
            additionalFields: { state: { type: "string", required: false, input: false, defaultValue: "active" } },
          },
          invitation: {
            modelName: "app.organization_invitations",
            fields: {
              organizationId: "organization_id",
              expiresAt: "expires_at",
              inviterId: "inviter_id",
              createdAt: "created_at",
            },
          },
          session: { fields: { activeOrganizationId: "active_organization_id" } },
        },
      }),
      twoFactor({
        issuer: "TalentStroom",
        backupCodeOptions: { storeBackupCodes: "encrypted" },
        schema: {
          user: { fields: { twoFactorEnabled: "two_factor_enabled" } },
          twoFactor: {
            modelName: "auth_two_factors",
            fields: {
              backupCodes: "backup_codes",
              userId: "user_id",
              failedVerificationCount: "failed_verification_count",
              lockedUntil: "locked_until",
            },
          },
        },
      }),
      admin({
        ac: platformAc,
        roles: platformRoles,
        defaultRole: "user",
        adminRoles: ["platform-support"],
        adminUserIds: [],
        schema: {
          user: { fields: { role: "platform_role", banReason: "ban_reason", banExpires: "ban_expires" } },
          session: { fields: { impersonatedBy: "impersonated_by" } },
        },
      }),
      sessionRotation(),
    ],
  });

  // Our own identity queries (memberships, organizations, security events) on the same
  // ts_auth pool. Never run them inside a Better Auth callback: the pool has one connection.
  const db = new Kysely<IdentityDatabase>({ dialect: new PostgresDialect({ pool }) });

  return {
    auth,
    db,
    /** Ends the request's pool; safe to call more than once. */
    close: (() => {
      let closing: Promise<void> | undefined;
      return () => (closing ??= pool.end().catch(() => undefined));
    })(),
  };
}

export type AuthHandle = ReturnType<typeof createAuth>;
export type Auth = AuthHandle["auth"];
