// Shared test environment for API unit tests.
// These routes never touch the database; any use of the binding fails the test loudly.
const unavailable = (): never => {
  throw new Error("HYPERDRIVE is not available in unit tests");
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

export const testEnv: Env = { SERVICE_NAME: "api", ENVIRONMENT: "development", HYPERDRIVE: unavailableHyperdrive };
