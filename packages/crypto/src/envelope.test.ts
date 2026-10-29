import { describe, expect, it } from "vitest";
import { type RecordPlaintext, decryptRecord, encryptRecord, rewrapRecord } from "./envelope.ts";
import {
  CryptoError,
  CryptoInputError,
  CryptoIntegrityError,
  EnvelopeFormatError,
  KmsUnavailableError,
} from "./errors.ts";
import { type EncryptedEnvelope, serializeEnvelope } from "./format.ts";
import type { KeyManagementService } from "./kms.ts";
import { createLocalKms } from "./local-kms.ts";
import {
  ENVIRONMENT,
  KEK_A,
  KEK_B,
  ORG_B,
  RECORD_2,
  containsBytes,
  context,
  flipBit,
  setup,
  toHex,
} from "./test-fixtures.ts";

function asCryptoError(error: unknown): CryptoError {
  if (!(error instanceof CryptoError)) throw new Error("expected a CryptoError");
  return error;
}

const SAMPLE = { email: "test@example.nl", phone: "+31612345678", notes: ["synthetic", 1, true, null] };

async function encryptSample(deps: { kms: KeyManagementService; environment: string }) {
  return encryptRecord(context(), SAMPLE, { ...deps, kekRef: KEK_A });
}

describe("encryptRecord / decryptRecord round trip", () => {
  it("round-trips JSON", async () => {
    const { deps } = await setup();
    const envelope = await encryptSample(deps);
    expect(envelope).toMatchObject({ formatVersion: 1, algorithm: "AES-256-GCM", kekRef: KEK_A, keyVersion: 1 });
    expect(envelope.nonce.byteLength).toBe(12);
    await expect(decryptRecord(context(), envelope, deps)).resolves.toEqual({ kind: "json", value: SAMPLE });
  });

  it("round-trips bytes, including empty input, without modifying the caller's buffer", async () => {
    const { deps } = await setup();
    const roundTrip = async (plaintext: Uint8Array) => {
      const before = plaintext.slice();
      const envelope = await encryptRecord(context(), plaintext, { ...deps, kekRef: KEK_A });
      expect(plaintext).toEqual(before);
      await expect(decryptRecord(context(), envelope, deps)).resolves.toEqual({ kind: "bytes", bytes: before });
    };
    await Promise.all([roundTrip(new Uint8Array([1, 2, 3, 0, 255])), roundTrip(new Uint8Array(0))]);
  });

  it("accepts upper-case UUIDs as the same context", async () => {
    const { deps } = await setup();
    const envelope = await encryptSample(deps);
    const upper = context({ organizationId: context().organizationId.toUpperCase() });
    await expect(decryptRecord(upper, envelope, deps)).resolves.toMatchObject({ kind: "json" });
  });

  it("uses a fresh DEK and nonce per call (same plaintext, different envelopes)", async () => {
    const { deps } = await setup();
    const a = await encryptSample(deps);
    const b = await encryptSample(deps);
    expect(toHex(a.ciphertext)).not.toBe(toHex(b.ciphertext));
    expect(toHex(a.wrappedDek)).not.toBe(toHex(b.wrappedDek));
    expect(toHex(a.nonce)).not.toBe(toHex(b.nonce));
  });

  it("never repeats a nonce over many encryptions", async () => {
    const { deps } = await setup();
    const count = 2000;
    const envelopes = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        encryptRecord(context(), new Uint8Array([i & 0xff]), { ...deps, kekRef: KEK_A }),
      ),
    );
    expect(new Set(envelopes.map((e) => toHex(e.nonce))).size).toBe(count);
  });

  it("keeps the plaintext out of the envelope", async () => {
    const { deps } = await setup();
    const bytes = serializeEnvelope(await encryptSample(deps));
    expect(containsBytes(bytes, new TextEncoder().encode("test@example.nl"))).toBe(false);
  });
});

describe("tampering is detected", () => {
  const cases: [string, (e: EncryptedEnvelope) => EncryptedEnvelope][] = [
    ["ciphertext", (e) => ({ ...e, ciphertext: flipBit(e.ciphertext, 0) })],
    ["tag", (e) => ({ ...e, ciphertext: flipBit(e.ciphertext, e.ciphertext.byteLength - 1) })],
    ["nonce", (e) => ({ ...e, nonce: flipBit(e.nonce, 5) })],
    ["wrapped DEK (body)", (e) => ({ ...e, wrappedDek: flipBit(e.wrappedDek, e.wrappedDek.byteLength - 3) })],
    ["wrapped DEK (version header)", (e) => ({ ...e, wrappedDek: flipBit(e.wrappedDek, 4) })],
    ["key version metadata", (e) => ({ ...e, keyVersion: e.keyVersion + 1 })],
    ["truncated ciphertext", (e) => ({ ...e, ciphertext: e.ciphertext.slice(0, -1) })],
  ];
  for (const [name, tamper] of cases) {
    it(`rejects a modified ${name}`, async () => {
      const { deps } = await setup();
      const envelope = await encryptSample(deps);
      await expect(decryptRecord(context(), tamper(envelope), deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
    });
  }
});

describe("AAD binding", () => {
  it("rejects an envelope swapped between organizations", async () => {
    const { deps } = await setup();
    const fromA = await encryptRecord(context(), SAMPLE, { ...deps, kekRef: KEK_A });
    const fromB = await encryptRecord(context({ organizationId: ORG_B }), SAMPLE, { ...deps, kekRef: KEK_B });
    await expect(decryptRecord(context({ organizationId: ORG_B }), fromA, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
    await expect(decryptRecord(context(), fromB, deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });

  it("rejects an envelope swapped between organizations sharing one KEK", async () => {
    const { deps } = await setup();
    const fromA = await encryptRecord(context(), SAMPLE, { ...deps, kekRef: KEK_A });
    await expect(decryptRecord(context({ organizationId: ORG_B }), fromA, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
  });

  it("rejects an envelope swapped between records", async () => {
    const { deps } = await setup();
    const one = await encryptSample(deps);
    await expect(decryptRecord(context({ recordId: RECORD_2 }), one, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
  });

  it("rejects a ciphertext combined with another record's wrapped DEK", async () => {
    const { deps } = await setup();
    const one = await encryptSample(deps);
    const two = await encryptRecord(context({ recordId: RECORD_2 }), SAMPLE, { ...deps, kekRef: KEK_A });
    const mixed = { ...one, wrappedDek: two.wrappedDek };
    await expect(decryptRecord(context(), mixed, deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });

  it("rejects a wrong record type, schema version or environment", async () => {
    const { kms, deps } = await setup();
    const envelope = await encryptSample(deps);
    await expect(decryptRecord(context({ recordType: "note" }), envelope, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
    await expect(decryptRecord(context({ schemaVersion: 2 }), envelope, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
    await expect(decryptRecord(context(), envelope, { kms, environment: "staging" })).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
  });

  it("rejects a wrong kekRef", async () => {
    const { deps } = await setup();
    await encryptRecord(context(), SAMPLE, { ...deps, kekRef: KEK_B }); // KEK_B exists
    const envelope = await encryptSample(deps);
    await expect(decryptRecord(context(), { ...envelope, kekRef: KEK_B }, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
    await expect(decryptRecord(context(), { ...envelope, kekRef: "test/unknown" }, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
  });

  it("cannot decrypt with a different KMS (keys are external)", async () => {
    const { deps } = await setup();
    const envelope = await encryptSample(deps);
    const otherKms = await createLocalKms({ environment: ENVIRONMENT });
    await expect(
      decryptRecord(context(), envelope, { kms: otherKms, environment: ENVIRONMENT }),
    ).rejects.toBeInstanceOf(CryptoIntegrityError);
  });
});

describe("KMS failures fail closed", () => {
  it("rejects encryption during an outage and recovers afterwards", async () => {
    const { kms, deps } = await setup();
    kms.setAvailable(false);
    await expect(encryptSample(deps)).rejects.toBeInstanceOf(KmsUnavailableError);
    kms.setAvailable(true);
    await expect(encryptSample(deps)).resolves.toMatchObject({ kekRef: KEK_A });
  });

  it("rejects decryption during an outage with no plaintext fallback", async () => {
    const { kms, deps } = await setup();
    const envelope = await encryptSample(deps);
    kms.setAvailable(false);
    let plaintext: unknown;
    const error = await decryptRecord(context(), envelope, deps).then(
      (value) => {
        plaintext = value;
        return undefined;
      },
      (e: unknown) => e,
    );
    expect(plaintext).toBeUndefined();
    expect(error).toBeInstanceOf(KmsUnavailableError);
  });

  it("maps unknown adapter errors to KmsUnavailableError without leaking their message", async () => {
    const leaky: KeyManagementService = {
      wrapKey: () => Promise.reject(new Error("upstream said: test@example.nl key=deadbeef")),
      unwrapKey: () => Promise.reject(new Error("upstream said: test@example.nl key=deadbeef")),
    };
    const error = await encryptRecord(context(), SAMPLE, { kms: leaky, environment: ENVIRONMENT, kekRef: KEK_A }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(KmsUnavailableError);
    expect(String(error)).not.toContain("example.nl");
    expect(asCryptoError(error).cause).toBeUndefined();
  });

  it("rejects an adapter that reports a different key version or key length", async () => {
    const { kms, deps } = await setup();
    const envelope = await encryptSample(deps);
    const wrongVersion: KeyManagementService = {
      wrapKey: (...args) => kms.wrapKey(...args),
      unwrapKey: async (...args) => ({ ...(await kms.unwrapKey(...args)), keyVersion: 7 }),
    };
    const shortKey: KeyManagementService = {
      wrapKey: (...args) => kms.wrapKey(...args),
      unwrapKey: async (...args) => ({ ...(await kms.unwrapKey(...args)), key: new Uint8Array(16) }),
    };
    await Promise.all(
      [wrongVersion, shortKey].map((bad) =>
        expect(decryptRecord(context(), envelope, { kms: bad, environment: ENVIRONMENT })).rejects.toBeInstanceOf(
          CryptoIntegrityError,
        ),
      ),
    );
  });
});

describe("rewrapRecord", () => {
  it("rewraps after rotation: new version decrypts, old version is unusable once disabled", async () => {
    const { kms, deps } = await setup();
    const original = await encryptSample(deps);
    expect(await kms.rotateKey(KEK_A)).toBe(2);
    const rewrapped = await rewrapRecord(context(), original, KEK_A, deps);
    expect(rewrapped.keyVersion).toBe(2);
    expect(rewrapped.ciphertext).toEqual(original.ciphertext);
    expect(rewrapped.nonce).toEqual(original.nonce);
    expect(toHex(rewrapped.wrappedDek)).not.toBe(toHex(original.wrappedDek));

    kms.disableKeyVersion(KEK_A, 1);
    await expect(decryptRecord(context(), rewrapped, deps)).resolves.toEqual({ kind: "json", value: SAMPLE });
    await expect(decryptRecord(context(), original, deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });

  it("moves a record to another KEK without re-encrypting it", async () => {
    const { kms, deps } = await setup();
    const original = await encryptSample(deps);
    const moved = await rewrapRecord(context(), original, KEK_B, deps);
    expect(moved.kekRef).toBe(KEK_B);
    expect(moved.ciphertext).toEqual(original.ciphertext);
    kms.disableKeyVersion(KEK_A, 1);
    await expect(decryptRecord(context(), moved, deps)).resolves.toEqual({ kind: "json", value: SAMPLE });
    await expect(decryptRecord(context(), original, deps)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });

  it("refuses to rewrap with the wrong context", async () => {
    const { deps } = await setup();
    const original = await encryptSample(deps);
    await expect(rewrapRecord(context({ recordId: RECORD_2 }), original, KEK_B, deps)).rejects.toBeInstanceOf(
      CryptoIntegrityError,
    );
  });
});

describe("input validation", () => {
  it("rejects malformed context, environment and kekRef", async () => {
    const { deps } = await setup();
    const bad = [
      () => encryptRecord(context({ organizationId: "not-a-uuid" }), SAMPLE, { ...deps, kekRef: KEK_A }),
      () => encryptRecord(context({ recordId: "" }), SAMPLE, { ...deps, kekRef: KEK_A }),
      () => encryptRecord(context({ recordType: "Candidate Private" }), SAMPLE, { ...deps, kekRef: KEK_A }),
      () => encryptRecord(context({ schemaVersion: 0 }), SAMPLE, { ...deps, kekRef: KEK_A }),
      () => encryptRecord(context({ schemaVersion: 1.5 }), SAMPLE, { ...deps, kekRef: KEK_A }),
      () => encryptRecord(context(), SAMPLE, { ...deps, environment: "", kekRef: KEK_A }),
      () => encryptRecord(context(), SAMPLE, { ...deps, kekRef: "has space" }),
    ];
    await Promise.all(bad.map((call) => expect(call()).rejects.toBeInstanceOf(CryptoInputError)));
  });

  it("rejects unserialisable or oversized plaintext", async () => {
    const { deps } = await setup();
    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    const inputs: unknown[] = [cyclic, undefined, () => 1, 10n, new Uint8Array(1024 * 1024 + 1)];
    await Promise.all(
      inputs.map((input) =>
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately invalid input
        expect(encryptRecord(context(), input as RecordPlaintext, { ...deps, kekRef: KEK_A })).rejects.toBeInstanceOf(
          CryptoInputError,
        ),
      ),
    );
  });

  it("rejects envelope objects with wrong field sizes", async () => {
    const { deps } = await setup();
    const envelope = await encryptSample(deps);
    await expect(
      decryptRecord(context(), { ...envelope, nonce: envelope.nonce.slice(0, 11) }, deps),
    ).rejects.toBeInstanceOf(EnvelopeFormatError);
  });
});

describe("error hygiene", () => {
  it("never puts plaintext, key material, ciphertext or identifiers in errors", async () => {
    const { kms, deps } = await setup();
    const envelope = await encryptSample(deps);
    const secrets = [
      "test@example.nl",
      "612345678",
      toHex(envelope.wrappedDek),
      toHex(envelope.ciphertext).slice(0, 16),
      toHex(envelope.nonce),
      KEK_A,
      context().organizationId,
      context().recordId,
    ];
    const errors: unknown[] = [];
    const capture = (p: Promise<unknown>) =>
      p.then(
        () => undefined,
        (e: unknown) => void errors.push(e),
      );
    await capture(decryptRecord(context({ organizationId: ORG_B }), envelope, deps));
    await capture(decryptRecord(context(), { ...envelope, ciphertext: flipBit(envelope.ciphertext, 1) }, deps));
    await capture(decryptRecord(context(), { ...envelope, nonce: new Uint8Array(3) }, deps));
    await capture(encryptRecord(context({ organizationId: "test@example.nl" }), SAMPLE, { ...deps, kekRef: KEK_A }));
    kms.setAvailable(false);
    await capture(decryptRecord(context(), envelope, deps));
    await capture(encryptSample(deps));

    expect(errors).toHaveLength(6);
    for (const error of errors.map(asCryptoError)) {
      const rendered = [String(error), JSON.stringify(error), error.stack ?? ""].join("\n");
      for (const secret of secrets) expect(rendered).not.toContain(secret);
      expect(error.cause).toBeUndefined();
    }
  });
});
