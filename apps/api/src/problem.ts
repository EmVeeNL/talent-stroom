import { PROBLEMS, type ValidationProblem } from "@talentstroom/contracts";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import type { Context } from "hono";

export interface AppEnv {
  Bindings: Env;
  Variables: { requestId: string };
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
