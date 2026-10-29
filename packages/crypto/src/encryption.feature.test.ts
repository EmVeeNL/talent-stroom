// BDD scenarios from docs/architecture/engineering/02-bdd-testing.md (encryption.feature) and
// issue #76, exercised at the package level with the local fake KMS and an in-memory "row".
import { describe, expect, it } from "vitest";
import { decryptRecord, encryptRecord } from "./envelope.ts";
import { CryptoIntegrityError } from "./errors.ts";
import { parseEnvelope, serializeEnvelope } from "./format.ts";
import { createLocalKms } from "./local-kms.ts";
import {
  ENVIRONMENT,
  KEK_A,
  KEK_B,
  ORG_A,
  ORG_B,
  RECORD_1,
  RECORD_2,
  containsBytes,
  context,
  setup,
} from "./test-fixtures.ts";

describe("Feature: Confidential candidate storage", () => {
  it("Scenario: A database dump excludes readable candidate identity", async () => {
    // Given a candidate with email "test@example.nl" was saved
    const { deps } = await setup();
    const envelope = await encryptRecord(context(), { email: "test@example.nl" }, { ...deps, kekRef: KEK_A });
    const row = { candidate_id: RECORD_1, organization_id: ORG_A, payload: serializeEnvelope(envelope) };

    // When an authorized test harness inspects the database row
    const stored = parseEnvelope(row.payload);

    // Then the email is not present in plaintext
    const encoder = new TextEncoder();
    for (const needle of ["test@example.nl", "test@", "example.nl"]) {
      expect(containsBytes(row.payload, encoder.encode(needle))).toBe(false);
    }
    // And the row contains a wrapped data key
    expect(stored.wrappedDek.byteLength).toBeGreaterThan(32);
    expect(stored.kekRef).toBe(KEK_A);
    // And the record cannot decrypt without the external KMS
    const unrelatedKms = await createLocalKms({ environment: ENVIRONMENT });
    await expect(
      decryptRecord(context(), stored, { kms: unrelatedKms, environment: ENVIRONMENT }),
    ).rejects.toBeInstanceOf(CryptoIntegrityError);
    await expect(decryptRecord(context(), stored, deps)).resolves.toEqual({
      kind: "json",
      value: { email: "test@example.nl" },
    });
  });

  it("Scenario: Swapped ciphertext is rejected", async () => {
    // Given candidates exist in different organizations
    const { deps } = await setup();
    const ctxA = context({ organizationId: ORG_A, recordId: RECORD_1 });
    const ctxB = context({ organizationId: ORG_B, recordId: RECORD_2 });
    const rows = new Map([
      [RECORD_1, serializeEnvelope(await encryptRecord(ctxA, { email: "a@example.nl" }, { ...deps, kekRef: KEK_A }))],
      [RECORD_2, serializeEnvelope(await encryptRecord(ctxB, { email: "b@example.nl" }, { ...deps, kekRef: KEK_B }))],
    ]);

    // When their ciphertext envelopes are swapped in a test database
    const payloadA = rows.get(RECORD_1);
    const payloadB = rows.get(RECORD_2);
    if (payloadA === undefined || payloadB === undefined) throw new Error("fixture missing");
    rows.set(RECORD_1, payloadB);
    rows.set(RECORD_2, payloadA);

    // Then authenticated decryption fails
    await expect(decryptRecord(ctxA, parseEnvelope(payloadB), deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
    await expect(decryptRecord(ctxB, parseEnvelope(payloadA), deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });
});
