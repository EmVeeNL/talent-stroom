import { describe, expect, it } from "vitest";
import { CryptoInputError, CryptoIntegrityError, ForbiddenEnvironmentError, KmsUnavailableError } from "./errors.ts";
import { createLocalKms } from "./local-kms.ts";
import { KEK_A, KEK_B } from "./test-fixtures.ts";

const AAD = new TextEncoder().encode("synthetic-aad");
const OTHER_AAD = new TextEncoder().encode("synthetic-aae");
// Obviously synthetic development secret: 32 bytes counting up. Never a real key.
const DEV_SECRET = Uint8Array.from({ length: 32 }, (_, i) => i);

function dek(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

describe("createLocalKms", () => {
  it("refuses to run in production", async () => {
    await Promise.all(
      ["production", "Production", " prod "].map((environment) =>
        expect(createLocalKms({ environment })).rejects.toBeInstanceOf(ForbiddenEnvironmentError),
      ),
    );
  });

  it("wraps and unwraps with AAD enforced", async () => {
    const kms = await createLocalKms({ environment: "test" });
    const key = dek();
    const { wrappedKey, keyVersion } = await kms.wrapKey(KEK_A, key, AAD);
    expect(keyVersion).toBe(1);
    await expect(kms.unwrapKey(KEK_A, wrappedKey, AAD)).resolves.toEqual({ key, keyVersion: 1 });
    await expect(kms.unwrapKey(KEK_A, wrappedKey, OTHER_AAD)).rejects.toBeInstanceOf(CryptoIntegrityError);
    await expect(kms.unwrapKey(KEK_B, wrappedKey, AAD)).rejects.toBeInstanceOf(CryptoIntegrityError);
    await expect(kms.wrapKey(KEK_A, key, new Uint8Array(0))).rejects.toBeInstanceOf(CryptoInputError);
  });

  it("random KEKs are not shared between instances; a dev secret makes them reproducible", async () => {
    const key = dek();
    const random = await createLocalKms({ environment: "test" });
    const { wrappedKey } = await random.wrapKey(KEK_A, key, AAD);
    const otherRandom = await createLocalKms({ environment: "test" });
    await expect(otherRandom.unwrapKey(KEK_A, wrappedKey, AAD)).rejects.toBeInstanceOf(CryptoIntegrityError);

    const devA = await createLocalKms({ environment: "dev", devSecret: DEV_SECRET });
    const devB = await createLocalKms({ environment: "dev", devSecret: DEV_SECRET });
    const wrapped = await devA.wrapKey(KEK_A, key, AAD);
    await expect(devB.unwrapKey(KEK_A, wrapped.wrappedKey, AAD)).resolves.toEqual({ key, keyVersion: 1 });
    await expect(devB.unwrapKey(KEK_B, wrapped.wrappedKey, AAD)).rejects.toBeInstanceOf(CryptoIntegrityError);
  });

  it("rejects a short dev secret", async () => {
    await expect(createLocalKms({ environment: "dev", devSecret: new Uint8Array(16) })).rejects.toBeInstanceOf(
      CryptoInputError,
    );
  });

  it("rotates, keeps old versions readable until disabled", async () => {
    const kms = await createLocalKms({ environment: "test" });
    const key = dek();
    const v1 = await kms.wrapKey(KEK_A, key, AAD);
    expect(await kms.rotateKey(KEK_A)).toBe(2);
    const v2 = await kms.wrapKey(KEK_A, key, AAD);
    expect(v2.keyVersion).toBe(2);
    await expect(kms.unwrapKey(KEK_A, v1.wrappedKey, AAD)).resolves.toMatchObject({ keyVersion: 1 });
    kms.disableKeyVersion(KEK_A, 1);
    await expect(kms.unwrapKey(KEK_A, v1.wrappedKey, AAD)).rejects.toBeInstanceOf(CryptoIntegrityError);
    await expect(kms.unwrapKey(KEK_A, v2.wrappedKey, AAD)).resolves.toMatchObject({ keyVersion: 2 });
  });

  it("creates exactly one KEK per reference under concurrent first use", async () => {
    const kms = await createLocalKms({ environment: "test" });
    const keys = Array.from({ length: 20 }, dek);
    const wrapped = await Promise.all(keys.map((key) => kms.wrapKey(KEK_A, key, AAD)));
    const unwrapped = await Promise.all(wrapped.map((w) => kms.unwrapKey(KEK_A, w.wrappedKey, AAD)));
    expect(unwrapped.map((u) => u.key)).toEqual(keys);
  });

  it("simulates an outage", async () => {
    const kms = await createLocalKms({ environment: "test" });
    const { wrappedKey } = await kms.wrapKey(KEK_A, dek(), AAD);
    kms.setAvailable(false);
    await expect(kms.wrapKey(KEK_A, dek(), AAD)).rejects.toBeInstanceOf(KmsUnavailableError);
    await expect(kms.unwrapKey(KEK_A, wrappedKey, AAD)).rejects.toBeInstanceOf(KmsUnavailableError);
    kms.setAvailable(true);
    await expect(kms.unwrapKey(KEK_A, wrappedKey, AAD)).resolves.toMatchObject({ keyVersion: 1 });
  });
});
