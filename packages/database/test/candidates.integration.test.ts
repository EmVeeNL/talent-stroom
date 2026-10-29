/* eslint-disable no-await-in-loop -- Role and constraint probes run sequentially for deterministic database assertions. */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createLocalKms, CryptoIntegrityError } from "@talentstroom/crypto";
import {
  createCandidateService,
  createCandidate,
  updateCandidatePrivate,
  createDatabase,
  runMigrations,
  TenantContext,
} from "../src/index.ts";
import { localRoleUrl, setLocalDevPasswords } from "../src/local.ts";
import { createScratchDatabase, TEST_URL, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

describe.skipIf(TEST_URL === "")("encrypted candidates (Postgres)", () => {
  let scratch: ScratchDatabase;
  const orgA = randomUUID();
  const orgB = randomUUID();
  const tenantA = TenantContext.fromVerifiedMembership({ organizationId: orgA });
  const tenantB = TenantContext.fromVerifiedMembership({ organizationId: orgB });
  let kms: Awaited<ReturnType<typeof createLocalKms>>;
  const root = crypto.getRandomValues(new Uint8Array(32));
  const payload = { email: "Synthetic.Candidate@example.test", phone: "06 1234 5678", name: "Synthetic Candidate" };
  const admin = (query: string, params: unknown[] = []) =>
    withClient(scratch.url, (c) => c.query<Record<string, unknown>>(query, params));
  const open = () => {
    const db = createDatabase(localRoleUrl(scratch.url, "ts_app"));
    const service = createCandidateService(db, {
      kms: {
        async wrapKey(...args) {
          expect(
            (
              await admin(
                "SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND usename = 'ts_app' AND state = 'idle in transaction'",
              )
            ).rows,
          ).toEqual([]);
          return await kms.wrapKey(...args);
        },
        async unwrapKey(...args) {
          expect(
            (
              await admin(
                "SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND usename = 'ts_app' AND state = 'idle in transaction'",
              )
            ).rows,
          ).toEqual([]);
          return await kms.unwrapKey(...args);
        },
      },
      environment: "test",
      kekRef: "local/candidates",
      indexRoot: root,
      indexVersion: 1,
    });
    return { db, service };
  };
  beforeAll(async () => {
    kms = await createLocalKms({ environment: "test" });
    scratch = await createScratchDatabase();
    await runMigrations({ connectionString: scratch.url });
    await setLocalDevPasswords(scratch.url);
    await admin(
      "INSERT INTO app.organizations (id, name, slug) VALUES ($1, 'Synthetic A', 'candidate-a'), ($2, 'Synthetic B', 'candidate-b')",
      [orgA, orgB],
    );
  });
  afterAll(async () => {
    await scratch?.drop();
  });

  it("A database dump excludes readable candidate identity", async () => {
    const { db, service } = open();
    try {
      const id = randomUUID();
      await service.create(tenantA, { candidateId: id, schemaVersion: 1, payload });
      const result = await admin("SELECT envelope FROM app.candidate_private WHERE candidate_id = $1", [id]);
      const envelope = result.rows[0]?.["envelope"];
      if (!Buffer.isBuffer(envelope)) throw new Error("Missing envelope");
      expect(envelope.includes(Buffer.from(payload.email))).toBe(false);
      expect(envelope.includes(Buffer.from(payload.phone))).toBe(false);
      expect(await service.get(tenantA, id)).toEqual({ version: 1, schemaVersion: 1, payload });
      expect(await service.get(tenantB, id)).toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("Swapped ciphertext is rejected", async () => {
    const { db, service } = open();
    try {
      const a = randomUUID();
      const b = randomUUID();
      await service.create(tenantA, { candidateId: a, schemaVersion: 1, payload });
      await service.create(tenantB, { candidateId: b, schemaVersion: 1, payload });
      await admin(
        `UPDATE app.candidate_private SET envelope = CASE WHEN candidate_id = $1 THEN
        (SELECT envelope FROM app.candidate_private WHERE candidate_id = $2) ELSE
        (SELECT envelope FROM app.candidate_private WHERE candidate_id = $1) END WHERE candidate_id IN ($1, $2)`,
        [a, b],
      );
      await expect(service.get(tenantA, a)).rejects.toBeInstanceOf(CryptoIntegrityError);
      await expect(service.get(tenantB, b)).rejects.toBeInstanceOf(CryptoIntegrityError);
    } finally {
      await db.close();
    }
  });

  it("finds normalized email and phone only within the tenant", async () => {
    const { db, service } = open();
    try {
      const id = randomUUID();
      const unique = { email: "Lookup.Only@example.test", phone: "+31 6 8765 4321" };
      await service.create(tenantA, { candidateId: id, schemaVersion: 1, payload: unique });
      expect(await service.find(tenantA, "email", " LOOKUP.ONLY@EXAMPLE.TEST ")).toEqual([id]);
      expect(await service.find(tenantA, "phone", "0031 (0)6 8765 4321")).toEqual([id]);
      expect(await service.find(tenantB, "email", unique.email)).toEqual([]);
      expect(await service.find(tenantB, "phone", unique.phone)).toEqual([]);
    } finally {
      await db.close();
    }
  });

  it("returns an optimistic conflict and keeps envelope and indexes consistent", async () => {
    const { db, service } = open();
    try {
      const id = randomUUID();
      await service.create(tenantA, { candidateId: id, schemaVersion: 1, payload: { email: "old@example.test" } });
      const update = (email: string) =>
        service.update(tenantA, { candidateId: id, schemaVersion: 1, expectedVersion: 1, payload: { email } });
      const results = await Promise.all([update("winner@example.test"), update("loser@example.test")]);
      expect(results.filter((r) => r.kind === "updated")).toHaveLength(1);
      expect(results.filter((r) => r.kind === "conflict")).toHaveLength(1);
      const stored = await service.get(tenantA, id);
      expect(stored?.version).toBe(2);
      const value = stored?.payload;
      if (typeof value !== "object" || value === null || !("email" in value) || typeof value.email !== "string")
        throw new Error("Missing email");
      const email = value.email;
      expect(await service.find(tenantA, "email", email)).toEqual([id]);
      expect(await service.find(tenantA, "email", "old@example.test")).toEqual([]);
      expect(
        await service.find(
          tenantA,
          "email",
          email === "winner@example.test" ? "loser@example.test" : "winner@example.test",
        ),
      ).toEqual([]);
      expect(await service.update(tenantB, { candidateId: id, schemaVersion: 1, expectedVersion: 2, payload })).toEqual(
        { kind: "conflict" },
      );
    } finally {
      await db.close();
    }
  });

  it("fails closed without tenant context and denies ts_auth", async () => {
    for (const table of ["candidates", "candidate_private", "candidate_blind_indexes"]) {
      await withClient(localRoleUrl(scratch.url, "ts_app"), async (c) => {
        expect((await c.query(`SELECT * FROM app.${table}`)).rows).toEqual([]);
      });
      await withClient(localRoleUrl(scratch.url, "ts_auth"), async (c) => {
        await expect(c.query(`SELECT * FROM app.${table}`)).rejects.toMatchObject({ code: "42501" });
      });
    }
  });

  it("enforces envelope, index, status and composite tenant constraints", async () => {
    const { db, service } = open();
    try {
      const id = randomUUID();
      await service.create(tenantA, { candidateId: id, schemaVersion: 1, payload });
      for (const [query, params, code] of [
        ["UPDATE app.candidate_private SET envelope = decode('02', 'hex') WHERE candidate_id = $1", [id], "23514"],
        ["UPDATE app.candidate_private SET payload_schema_version = 0 WHERE candidate_id = $1", [id], "23514"],
        ["UPDATE app.candidate_blind_indexes SET digest = decode('00', 'hex') WHERE candidate_id = $1", [id], "23514"],
        ["UPDATE app.candidate_blind_indexes SET field_code = 'name' WHERE candidate_id = $1", [id], "23514"],
        ["UPDATE app.candidate_blind_indexes SET index_version = 0 WHERE candidate_id = $1", [id], "23514"],
        ["UPDATE app.candidates SET status = 'unknown' WHERE id = $1", [id], "23514"],
        ["UPDATE app.candidate_private SET organization_id = $2 WHERE candidate_id = $1", [id, orgB], "23503"],
        ["UPDATE app.candidate_blind_indexes SET organization_id = $2 WHERE candidate_id = $1", [id, orgB], "23503"],
        [
          "INSERT INTO app.candidate_blind_indexes (organization_id, candidate_id, field_code, index_version, digest) SELECT organization_id, candidate_id, field_code, index_version, digest FROM app.candidate_blind_indexes WHERE candidate_id = $1",
          [id],
          "23505",
        ],
      ] as const) {
        await expect(admin(query, [...params])).rejects.toMatchObject({ code });
      }
      // Every candidate table is owned by ts_owner and has ENABLE + FORCE RLS.
      const flags = await admin(
        "SELECT relowner::regrole::text AS owner, relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid IN ('app.candidates'::regclass, 'app.candidate_private'::regclass, 'app.candidate_blind_indexes'::regclass)",
      );
      expect(flags.rows).toHaveLength(3);
      for (const row of flags.rows)
        expect(row).toEqual({ owner: "ts_owner", relrowsecurity: true, relforcerowsecurity: true });
      await withClient(localRoleUrl(scratch.url, "ts_app"), async (c) => {
        await c.query("BEGIN");
        try {
          await c.query("SELECT set_config('app.organization_id', $1, true)", [orgB]);
          await expect(
            c.query("INSERT INTO app.candidates (organization_id) VALUES ($1)", [orgA]),
          ).rejects.toMatchObject({ code: "42501" });
        } finally {
          await c.query("ROLLBACK");
        }
      });
    } finally {
      await db.close();
    }
  });

  it("rolls back failed creates and updates including the version increment", async () => {
    const { db, service } = open();
    try {
      const id = randomUUID();
      const invalid = {
        candidateId: id,
        schemaVersion: 1,
        envelope: new Uint8Array([1]),
        indexes: [{ fieldCode: "email" as const, indexVersion: 1, digest: new Uint8Array(1) }],
      };
      await expect(createCandidate(db, tenantA, invalid)).rejects.toMatchObject({ code: "23514" });
      expect(await service.get(tenantA, id)).toBeUndefined();
      await service.create(tenantA, { candidateId: id, schemaVersion: 1, payload });
      await expect(updateCandidatePrivate(db, tenantA, { ...invalid, expectedVersion: 1 })).rejects.toMatchObject({
        code: "23514",
      });
      expect(await service.get(tenantA, id)).toEqual({ version: 1, schemaVersion: 1, payload });
      expect(await service.find(tenantA, "email", payload.email)).toContain(id);
    } finally {
      await db.close();
    }
  });

  it("rerunning migrations is a no-op", async () => {
    expect((await runMigrations({ connectionString: scratch.url })).applied).toEqual([]);
  });
});
