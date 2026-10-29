import { PROBLEMS, type ValidationProblem } from "@talentstroom/contracts";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import type { TenantContext } from "@talentstroom/database/tenant";
import type { Context } from "hono";
import type { AuthHandle } from "./auth/create-auth.ts";
import type { Principal, VerifiedMembership } from "./auth/types.ts";

export interface AppEnv {
  Bindings: Env;
  Variables: {
    requestId: string;
    /** Per-request Better Auth instance and ts_auth connection (identity routes only). */
    identity: AuthHandle;
    /** Set by requireSession. */
    principal: Principal;
    /** Set by requireMembership, after the membership was verified server-side. */
    membership: VerifiedMembership;
    tenant: TenantContext;
  };
}

/** Only catalog text and sanitized validation errors may enter a problem response. */
export function problem(c: Context<AppEnv>, name: keyof typeof PROBLEMS, errors?: ValidationProblem["errors"]) {
  const entry = PROBLEMS[name];
  return c.json(
    {
      type: entry.type,
      title: t(DEFAULT_LOCALE, entry.titleKey),
      status: entry.status,
      requestId: c.get("requestId"),
      ...(errors ? { errors } : {}),
    },
    entry.status,
    { "Content-Type": "application/problem+json" },
  );
}
