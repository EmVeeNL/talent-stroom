import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "kysely";
import { createDatabase, TenantContext, withTenant } from "../src/index.ts";

const pg = vi.hoisted(() => ({
  connect: vi.fn<() => Promise<void>>(),
  end: vi.fn<() => Promise<void>>(),
  query: vi.fn<(text: string, values?: readonly unknown[]) => Promise<object>>(),
  constructed: vi.fn<(options: object) => void>(),
}));
vi.mock("pg", () => ({
  Client: class {
    constructor(options: object) {
      pg.constructed(options);
    }
    connect = pg.connect;
    end = pg.end;
    query = pg.query;
    on() {
      return this;
    }
  },
}));

const organizationId = "00000000-0000-4000-8000-000000000001";
const membershipId = "00000000-0000-4000-8000-000000000002";
const tenant = () => TenantContext.fromVerifiedMembership({ organizationId });

beforeEach(() => {
  vi.clearAllMocks();
  pg.connect.mockResolvedValue();
  pg.end.mockResolvedValue();
  pg.query.mockResolvedValue({ rows: [], rowCount: 0, command: "SELECT" });
});

describe("verified tenant context", () => {
  it("copies and freezes verified identifiers", () => {
    const input = { organizationId, membershipId };
    const context = TenantContext.fromVerifiedMembership(input);
    input.organizationId = membershipId;
    expect(context.organizationId).toBe(organizationId);
    expect(context.membershipId).toBe(membershipId);
    expect(Object.isFrozen(context)).toBe(true);
  });

  it.each(["", "invalid", "00000000-0000-4000-8000-000000000001'", " 00000000-0000-4000-8000-000000000001"])(
    "rejects invalid organization and membership UUIDs without echoing them: %s",
    (invalid) => {
      expect(() => TenantContext.fromVerifiedMembership({ organizationId: invalid })).toThrow("Invalid tenant context");
      expect(() => TenantContext.fromVerifiedMembership({ organizationId, membershipId: invalid })).toThrow(
        "Invalid tenant context",
      );
      expect(pg.connect).not.toHaveBeenCalled();
    },
  );
});

describe("request database", () => {
  it("exposes no query builder and closes an unused handle without connecting", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    expect(db).not.toHaveProperty("selectFrom");
    expect(db).not.toHaveProperty("transaction");
    await db.close();
    await db.close();
    expect(pg.connect).not.toHaveBeenCalled();
    expect(pg.end).toHaveBeenCalledTimes(1);
    await expect(withTenant(db, tenant(), async () => undefined)).rejects.toThrow("Database is closed");
  });

  it("binds context as the first statement after BEGIN and commits the callback result", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    try {
      const context = TenantContext.fromVerifiedMembership({ organizationId, membershipId });
      expect(
        await withTenant(db, context, async (trx) => {
          await sql`select ${42}`.execute(trx);
          return 42;
        }),
      ).toBe(42);
      expect(pg.query.mock.calls).toEqual([
        ["begin", []],
        ["SELECT set_config('app.organization_id', $1, true)", [organizationId]],
        ["SELECT set_config('app.membership_id', $1, true)", [membershipId]],
        ["select $1", [42]],
        ["commit", []],
      ]);
      expect(pg.constructed).toHaveBeenCalledTimes(1);
      expect(pg.connect).toHaveBeenCalledTimes(1);
    } finally {
      await db.close();
    }
  });

  it("rejects missing and forged contexts before connecting or invoking the callback", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    const fn = vi.fn<() => Promise<void>>(async () => undefined);
    try {
      // @ts-expect-error Plain objects cannot stand in for verified membership.
      await expect(withTenant(db, { organizationId }, fn)).rejects.toThrow("Invalid tenant context");
      // @ts-expect-error Tenant context is mandatory.
      await expect(withTenant(db, undefined, fn)).rejects.toThrow("Invalid tenant context");
      expect(fn).not.toHaveBeenCalled();
      expect(pg.connect).not.toHaveBeenCalled();
    } finally {
      await db.close();
    }
  });

  it("rolls back callback errors and can reuse the connection", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    const failure = new Error("synthetic failure");
    try {
      await expect(
        withTenant(db, tenant(), () => {
          throw failure;
        }),
      ).rejects.toBe(failure);
      expect(pg.query.mock.calls.at(-1)).toEqual(["rollback", []]);
      await withTenant(db, tenant(), async () => undefined);
      expect(pg.connect).toHaveBeenCalledTimes(1);
    } finally {
      await db.close();
    }
  });

  it("does not invoke the callback if establishing context fails", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    const fn = vi.fn<() => Promise<void>>(async () => undefined);
    pg.query.mockResolvedValueOnce({ rows: [] }).mockRejectedValueOnce(new Error("synthetic SQL failure"));
    try {
      await expect(withTenant(db, tenant(), fn)).rejects.toThrow("synthetic SQL failure");
      expect(fn).not.toHaveBeenCalled();
      expect(pg.query.mock.calls.at(-1)).toEqual(["rollback", []]);
    } finally {
      await db.close();
    }
  });

  it("rejects builders retained after the tenant callback ends", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    try {
      const escaped = await withTenant(db, tenant(), async (trx) => () => sql`select 1`.execute(trx));
      const queries = pg.query.mock.calls.length;
      await expect(escaped()).rejects.toThrow("Tenant transaction callback has ended");
      expect(pg.query).toHaveBeenCalledTimes(queries);
    } finally {
      await db.close();
    }
  });

  it("releases queued acquisitions after a connection failure and still closes once", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    pg.connect.mockRejectedValueOnce(new Error("synthetic connection failure"));
    const fn = vi.fn<() => Promise<void>>(async () => undefined);
    try {
      const results = await Promise.allSettled([withTenant(db, tenant(), fn), withTenant(db, tenant(), fn)]);
      expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);
      expect(fn).not.toHaveBeenCalled();
      expect(pg.connect).toHaveBeenCalledTimes(1);
    } finally {
      await db.close();
    }
    expect(pg.end).toHaveBeenCalledTimes(1);
  });

  it("waits for an active transaction before closing the client", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    const entered = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const work = withTenant(db, tenant(), async () => {
      entered.resolve();
      await finish.promise;
    });
    await entered.promise;
    const closing = db.close();
    expect(pg.end).not.toHaveBeenCalled();
    finish.resolve();
    await work;
    await closing;
    expect(pg.query.mock.calls.at(-1)).toEqual(["commit", []]);
    expect(pg.end).toHaveBeenCalledTimes(1);
  });

  it("serializes concurrent transactions on its only client", async () => {
    const db = createDatabase<{}>("postgres://synthetic");
    const events: string[] = [];
    try {
      await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          withTenant(db, tenant(), async () => {
            events.push(`start ${i}`);
            await Promise.resolve();
            events.push(`end ${i}`);
          }),
        ),
      );
      expect(events).toEqual(Array.from({ length: 10 }, (_, i) => [`start ${i}`, `end ${i}`]).flat());
      expect(pg.connect).toHaveBeenCalledTimes(1);
    } finally {
      await db.close();
    }
  });
});
