import { Kysely, PostgresDialect, sql } from "kysely";
import type { KyselyPlugin, PostgresPool, PostgresPoolClient, Transaction } from "kysely";
import { Client } from "pg";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** A caller-verified membership, not an authentication or authorization check. */
export class TenantContext {
  readonly #verified = true;
  readonly organizationId: string;
  readonly membershipId: string | undefined;

  private constructor(organizationId: string, membershipId?: string) {
    this.organizationId = organizationId;
    this.membershipId = membershipId;
    Object.freeze(this);
  }

  /** Call only after server-side membership verification, never from a request header alone. */
  static fromVerifiedMembership(membership: { organizationId: string; membershipId?: string }): TenantContext {
    if (
      membership === null ||
      typeof membership !== "object" ||
      !isUuid(membership.organizationId) ||
      (membership.membershipId !== undefined && !isUuid(membership.membershipId))
    ) {
      throw new Error("Invalid tenant context");
    }
    return new TenantContext(membership.organizationId, membership.membershipId);
  }

  /** Also reject missing/forged contexts from untyped callers before opening a transaction. */
  static assertVerified(context: TenantContext): void {
    if (
      !(context instanceof TenantContext) ||
      !(#verified in context) ||
      !context.#verified ||
      !isUuid(context.organizationId) ||
      (context.membershipId !== undefined && !isUuid(context.membershipId))
    ) {
      throw new Error("Invalid tenant context");
    }
  }
}

/** Kysely's pool contract backed by exactly one request-owned pg Client (max: 1). */
class SingleClientPool implements PostgresPool {
  readonly options = { max: 1 };
  readonly #client: Client;
  #connected: Promise<Client> | undefined;
  #tail = Promise.resolve();
  #ending: Promise<void> | undefined;
  #closed = false;
  #failure: Error | undefined;

  constructor(connectionString: string) {
    this.#client = new Client({ connectionString });
    // pg emits idle connection failures as events. Remember the failure and fail closed;
    // never silently reconnect or replay work on another connection.
    this.#client.on("error", (error: Error) => {
      this.#failure = error;
    });
  }

  async connect(): Promise<PostgresPoolClient> {
    if (this.#closed) throw new Error("Database is closed");
    const previous = this.#tail;
    const { promise, resolve } = Promise.withResolvers<void>();
    this.#tail = promise;
    await previous;
    try {
      if (this.#closed) throw new Error("Database is closed");
      if (this.#failure !== undefined) throw this.#failure;
      this.#connected ??= this.#client.connect();
      await this.#connected;
      return { query: this.#client.query.bind(this.#client), release: resolve };
    } catch (error) {
      resolve();
      throw error;
    }
  }

  end(): Promise<void> {
    this.#closed = true;
    this.#ending ??= this.#tail.then(() => this.#client.end());
    return this.#ending;
  }
}

const runTenant = Symbol("runTenant");

/** Request-scoped tenant handle. The underlying Kysely and pg Client are private. */
class Database<DB> {
  readonly #pool: SingleClientPool;
  readonly #kysely: Kysely<DB>;

  constructor(connectionString: string) {
    this.#pool = new SingleClientPool(connectionString);
    this.#kysely = new Kysely<DB>({ dialect: new PostgresDialect({ pool: this.#pool }) });
  }

  /** Call after all request transactions finish; safe to call more than once. */
  close(): Promise<void> {
    // End directly: Kysely.destroy() does nothing if its driver was never initialized.
    // The pool owns the only resource, including when the handle was never used.
    return this.#pool.end();
  }

  [runTenant]<T>(tenant: TenantContext, fn: (trx: Transaction<DB>) => Promise<T>): Promise<T> {
    return this.#kysely.transaction().execute(async (trx) => {
      await sql`SELECT set_config('app.organization_id', ${tenant.organizationId}, true)`.execute(trx);
      if (tenant.membershipId !== undefined) {
        await sql`SELECT set_config('app.membership_id', ${tenant.membershipId}, true)`.execute(trx);
      }
      // Builders/transactions retained by the caller must not execute after this callback.
      let active = true;
      const lifetime: KyselyPlugin = {
        transformQuery: ({ node }) => {
          if (!active) throw new Error("Tenant transaction callback has ended");
          return node;
        },
        transformResult: ({ result }) => Promise.resolve(result),
      };
      try {
        return await fn(trx.withPlugin(lifetime));
      } finally {
        active = false;
      }
    });
  }
}

/** Create inside the request handler with HYPERDRIVE.connectionString (ts_app). */
export function createDatabase<DB>(connectionString: string): Database<DB> {
  return new Database<DB>(connectionString);
}

/** Membership must already be verified. Await every query; never perform external I/O here. */
export async function withTenant<DB, T>(
  db: Database<DB>,
  tenant: TenantContext,
  fn: (trx: Transaction<DB>) => Promise<T>,
): Promise<T> {
  TenantContext.assertVerified(tenant);
  return await db[runTenant](tenant, fn);
}

export type { Database };
