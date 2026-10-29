// Shared test environment for API unit tests.
// These routes never touch the database; any use of a binding fails the test loudly.
const unavailable = (): never => {
  throw new Error("Hyperdrive is not available in unit tests");
};
export const unavailableHyperdrive: Hyperdrive = {
  connect: unavailable,
  get connectionString() {
    return unavailable();
  },
  get host() {
    return unavailable();
  },
  get ip() {
    return unavailable();
  },
  get port() {
    return unavailable();
  },
  get user() {
    return unavailable();
  },
  get password() {
    return unavailable();
  },
  get database() {
    return unavailable();
  },
};

export const testEnv: Env = {
  SERVICE_NAME: "api",
  ENVIRONMENT: "development",
  MAIL_TRANSPORT: "none",
  HYPERDRIVE: unavailableHyperdrive,
  HYPERDRIVE_AUTH: unavailableHyperdrive,
  // Synthetic placeholder for tests only.
  BETTER_AUTH_SECRET: "unit-test-secret-not-used-anywhere-else-0000",
  BETTER_AUTH_URL: "http://localhost:5173",
  RATE_LIMIT_ANON: fakeRateLimit(),
  RATE_LIMIT_AUTH_ATTEMPT: fakeRateLimit(),
};

/** Fake Workers Rate Limiting binding for tests. */
export function fakeRateLimit(behaviour: "allow" | "limit" | "throw" = "allow"): RateLimit & { keys: string[] } {
  const keys: string[] = [];
  return {
    keys,
    limit: async ({ key }) => {
      keys.push(key);
      if (behaviour === "throw") throw new Error("rate limit binding unavailable");
      return { success: behaviour === "allow" };
    },
  };
}
