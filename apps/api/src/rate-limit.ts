import type { Context, MiddlewareHandler } from "hono";
import { problem, type AppEnv } from "./problem.ts";

type RateLimitBinding = {
  [K in keyof Env]: Env[K] extends RateLimit ? K : never;
}[keyof Env];

export interface RateLimitOptions {
  /** Derives the counter key. Must never contain raw personal data. */
  key: (c: Context<AppEnv>) => Promise<string>;
  /** Binding failure policy: true = allow the request (availability), false = reject with 429. */
  failOpen: boolean;
  /** Sent as Retry-After. The binding does not report remaining time, so use its window length. */
  retryAfterSeconds: number;
  skip?: (c: Context<AppEnv>) => boolean;
}

const NO_IP_KEY = "no-ip";

/** SHA-256 hex of the client IP (CF-Connecting-IP). Raw IPs never reach keys or logs. */
export async function ipKey(c: Context<AppEnv>): Promise<string> {
  const ip = c.req.header("CF-Connecting-IP");
  if (!ip) return NO_IP_KEY; // local dev and tests have no Cloudflare edge
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function rateLimit(binding: RateLimitBinding, options: RateLimitOptions): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (options.skip?.(c)) return next();
    let success: boolean;
    try {
      ({ success } = await c.env[binding].limit({ key: `${binding}:${await options.key(c)}` }));
    } catch {
      // Never log the key or error text (may carry the hashed IP); only fixed fields.
      console.warn(
        JSON.stringify({
          message: "rate limit binding failed",
          binding,
          failOpen: options.failOpen,
          requestId: c.get("requestId"),
        }),
      );
      success = options.failOpen;
    }
    if (!success) {
      c.header("Retry-After", String(options.retryAfterSeconds));
      return problem(c, "tooManyRequests");
    }
    return next();
  };
}

/** Sign-in, sign-up, password-reset and 2FA verification (src/auth/routes.ts). Fails closed. */
export const authAttemptLimit = rateLimit("RATE_LIMIT_AUTH_ATTEMPT", {
  key: ipKey,
  failOpen: false,
  retryAfterSeconds: 60,
});
