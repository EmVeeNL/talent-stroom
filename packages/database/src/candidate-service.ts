import {
  blindIndex,
  decryptRecord,
  deriveIndexKey,
  encryptRecord,
  normalizeEmail,
  normalizePhone,
  parseEnvelope,
  serializeEnvelope,
} from "@talentstroom/crypto";
import type { EncryptDeps, JsonValue } from "@talentstroom/crypto";
import {
  createCandidate,
  findCandidateIdsByBlindIndex,
  getCandidatePrivate,
  updateCandidatePrivate,
} from "./candidates.ts";
import type { CandidateBlindIndex, CandidateIndexField } from "./candidates.ts";
import { TenantContext } from "./tenant.ts";
import type { Database } from "./tenant.ts";

export interface CandidateServiceDeps extends EncryptDeps {
  /** Caller-owned per-environment root, already unwrapped outside DB transactions. Never persist it. */
  readonly indexRoot: Uint8Array;
  readonly indexVersion: number;
}
export interface CandidatePayload {
  [key: string]: JsonValue;
  email?: string;
  phone?: string;
}
export interface CandidateWrite {
  readonly candidateId: string;
  readonly schemaVersion: number;
  readonly payload: CandidatePayload;
}

const context = (tenant: TenantContext, candidateId: string, schemaVersion: number) => {
  TenantContext.assertVerified(tenant);
  return {
    organizationId: tenant.organizationId,
    recordType: "candidate_private",
    recordId: candidateId,
    schemaVersion,
  };
};

/** Request-scoped service. Construct with the authorized organization's KEK and verified tenant context. */
export function createCandidateService<DB>(db: Database<DB>, deps: CandidateServiceDeps) {
  const indexFor = async (
    tenant: TenantContext,
    fieldCode: CandidateIndexField,
    value: string,
  ): Promise<CandidateBlindIndex> => {
    TenantContext.assertVerified(tenant);
    const normalized = fieldCode === "email" ? normalizeEmail(value) : normalizePhone(value);
    const key = await deriveIndexKey(deps.indexRoot, {
      organizationId: tenant.organizationId,
      fieldCode,
      indexVersion: deps.indexVersion,
    });
    return { fieldCode, indexVersion: deps.indexVersion, digest: await blindIndex(key, normalized) };
  };
  const prepare = async (tenant: TenantContext, input: CandidateWrite) => {
    // All crypto finishes before the repository opens its transaction.
    const ctx = context(tenant, input.candidateId, input.schemaVersion);
    const indexes = await Promise.all(
      (["email", "phone"] as const).flatMap((field) => {
        const value = input.payload[field];
        return value === undefined ? [] : [indexFor(tenant, field, value)];
      }),
    );
    const envelope = serializeEnvelope(await encryptRecord(ctx, input.payload, deps));
    return { candidateId: input.candidateId, schemaVersion: input.schemaVersion, envelope, indexes };
  };
  return {
    async create(tenant: TenantContext, input: CandidateWrite & { ownerMembershipId?: string; source?: string }) {
      const prepared = await prepare(tenant, input);
      return await createCandidate(db, tenant, {
        ...prepared,
        ...(input.ownerMembershipId === undefined ? {} : { ownerMembershipId: input.ownerMembershipId }),
        ...(input.source === undefined ? {} : { source: input.source }),
      });
    },
    async update(tenant: TenantContext, input: CandidateWrite & { expectedVersion: number }) {
      const prepared = await prepare(tenant, input);
      return await updateCandidatePrivate(db, tenant, { ...prepared, expectedVersion: input.expectedVersion });
    },
    async get(tenant: TenantContext, candidateId: string) {
      const row = await getCandidatePrivate(db, tenant, candidateId);
      if (row === undefined) return undefined;
      // Repository has committed before KMS unwrap/decrypt starts. Schema version is authenticated by AEAD.
      const decrypted = await decryptRecord(
        context(tenant, candidateId, row.schemaVersion),
        parseEnvelope(row.envelope),
        deps,
      );
      if (decrypted.kind !== "json") throw new Error("Invalid candidate payload kind");
      return { version: row.version, schemaVersion: row.schemaVersion, payload: decrypted.value };
    },
    async find(tenant: TenantContext, field: CandidateIndexField, value: string) {
      return await findCandidateIdsByBlindIndex(db, tenant, await indexFor(tenant, field, value));
    },
  };
}
