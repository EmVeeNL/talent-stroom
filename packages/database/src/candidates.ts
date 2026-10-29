import { Buffer } from "node:buffer";
import { sql } from "kysely";
import type { Transaction } from "kysely";
import { withTenant } from "./tenant.ts";
import type { Database, TenantContext } from "./tenant.ts";

export type CandidateIndexField = "email" | "phone";
export interface CandidateBlindIndex {
  readonly fieldCode: CandidateIndexField;
  readonly indexVersion: number;
  readonly digest: Uint8Array;
}
export interface CandidatePrivateWrite {
  readonly candidateId: string;
  readonly envelope: Uint8Array;
  readonly schemaVersion: number;
  /** Complete replacement set, including all versions still being maintained. */
  readonly indexes: readonly CandidateBlindIndex[];
}
export interface CreateCandidateInput extends CandidatePrivateWrite {
  readonly ownerMembershipId?: string;
  /** Controlled code; no personal data. */
  readonly source?: string;
}
export interface UpdateCandidatePrivateInput extends CandidatePrivateWrite {
  readonly expectedVersion: number;
}
export type CandidateUpdateResult =
  | { readonly kind: "updated"; readonly version: number }
  | { readonly kind: "conflict" };
export interface CandidatePrivateRecord {
  readonly envelope: Uint8Array;
  readonly schemaVersion: number;
  readonly version: number;
}

async function insertIndexes<DB>(
  trx: Transaction<DB>,
  organizationId: string,
  input: CandidatePrivateWrite,
): Promise<void> {
  if (input.indexes.length === 0) return;
  const values = input.indexes.map(
    (index) =>
      sql`(${organizationId}, ${input.candidateId}, ${index.fieldCode}, ${index.indexVersion}, ${Buffer.from(index.digest)})`,
  );
  await sql`INSERT INTO app.candidate_blind_indexes (organization_id, candidate_id, field_code, index_version, digest)
    VALUES ${sql.join(values)}`.execute(trx);
}

/** Encrypted bytes only. Owns its transaction; never accepts a crypto callback. */
export async function createCandidate<DB>(
  db: Database<DB>,
  tenant: TenantContext,
  input: CreateCandidateInput,
): Promise<{ version: number }> {
  return await withTenant(db, tenant, async (trx) => {
    await sql`INSERT INTO app.candidates (id, organization_id, owner_membership_id, source)
      VALUES (${input.candidateId}, ${tenant.organizationId}, ${input.ownerMembershipId ?? null}, ${input.source ?? null})`.execute(
      trx,
    );
    await sql`INSERT INTO app.candidate_private (candidate_id, organization_id, envelope, payload_schema_version)
      VALUES (${input.candidateId}, ${tenant.organizationId}, ${Buffer.from(input.envelope)}, ${input.schemaVersion})`.execute(
      trx,
    );
    await insertIndexes(trx, tenant.organizationId, input);
    return { version: 1 };
  });
}

/** Returns ciphertext only after commit. Decrypt in the caller. */
export async function getCandidatePrivate<DB>(
  db: Database<DB>,
  tenant: TenantContext,
  candidateId: string,
): Promise<CandidatePrivateRecord | undefined> {
  return await withTenant(db, tenant, async (trx) => {
    const result =
      await sql<CandidatePrivateRecord>`SELECT p.envelope, p.payload_schema_version AS "schemaVersion", c.version
      FROM app.candidate_private p JOIN app.candidates c ON c.organization_id = p.organization_id AND c.id = p.candidate_id
      WHERE p.organization_id = ${tenant.organizationId} AND p.candidate_id = ${candidateId}`.execute(trx);
    return result.rows[0];
  });
}

/** Missing/inaccessible rows and stale versions share a conflict result, avoiding an existence oracle. */
export async function updateCandidatePrivate<DB>(
  db: Database<DB>,
  tenant: TenantContext,
  input: UpdateCandidatePrivateInput,
): Promise<CandidateUpdateResult> {
  return await withTenant(db, tenant, async (trx) => {
    const result = await sql<{ version: number }>`UPDATE app.candidates SET version = version + 1, updated_at = now()
      WHERE organization_id = ${tenant.organizationId} AND id = ${input.candidateId} AND version = ${input.expectedVersion}
      RETURNING version`.execute(trx);
    const row = result.rows[0];
    if (row === undefined) return { kind: "conflict" };
    const updated = await sql`UPDATE app.candidate_private SET envelope = ${Buffer.from(input.envelope)},
      payload_schema_version = ${input.schemaVersion}, updated_at = now()
      WHERE organization_id = ${tenant.organizationId} AND candidate_id = ${input.candidateId}`.execute(trx);
    if (updated.numAffectedRows !== 1n) throw new Error("Candidate private row missing");
    await sql`DELETE FROM app.candidate_blind_indexes WHERE organization_id = ${tenant.organizationId} AND candidate_id = ${input.candidateId}`.execute(
      trx,
    );
    await insertIndexes(trx, tenant.organizationId, input);
    return { kind: "updated", version: row.version };
  });
}

export async function findCandidateIdsByBlindIndex<DB>(
  db: Database<DB>,
  tenant: TenantContext,
  index: CandidateBlindIndex,
): Promise<string[]> {
  return await withTenant(db, tenant, async (trx) => {
    const result = await sql<{ candidate_id: string }>`SELECT candidate_id FROM app.candidate_blind_indexes
      WHERE organization_id = ${tenant.organizationId} AND field_code = ${index.fieldCode}
      AND index_version = ${index.indexVersion} AND digest = ${Buffer.from(index.digest)} ORDER BY candidate_id`.execute(
      trx,
    );
    return result.rows.map((r) => r.candidate_id);
  });
}
