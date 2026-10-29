import { describe, expect, it } from "vitest";
import { BLIND_INDEX_BYTES, blindIndex, deriveIndexKey, type IndexKeyScope } from "./blind-index.ts";
import { CryptoInputError } from "./errors.ts";
import { ORG_A, ORG_B, toHex } from "./test-fixtures.ts";

// Obviously synthetic root keys. Real roots are random and KMS-wrapped.
const ROOT = new Uint8Array(32).fill(0x11);
const OTHER_ROOT = new Uint8Array(32).fill(0x22);
const SCOPE: IndexKeyScope = { organizationId: ORG_A, fieldCode: "email", indexVersion: 1 };

async function digest(scope: IndexKeyScope, value = "test@example.nl", root = ROOT): Promise<string> {
  return toHex(await blindIndex(await deriveIndexKey(root, scope), value));
}

describe("deriveIndexKey / blindIndex", () => {
  it("is deterministic for equal inputs and returns 32 bytes", async () => {
    const key = await deriveIndexKey(ROOT, SCOPE);
    const a = await blindIndex(key, "test@example.nl");
    expect(a.byteLength).toBe(BLIND_INDEX_BYTES);
    expect(await digest(SCOPE)).toBe(toHex(a));
    expect(await digest({ ...SCOPE, organizationId: ORG_A.toUpperCase() })).toBe(toHex(a));
  });

  it("differs per organization, field, version, root and value", async () => {
    const base = await digest(SCOPE);
    const variants = await Promise.all([
      digest({ ...SCOPE, organizationId: ORG_B }),
      digest({ ...SCOPE, fieldCode: "phone" }),
      digest({ ...SCOPE, indexVersion: 2 }),
      digest(SCOPE, "test@example.nl", OTHER_ROOT),
      digest(SCOPE, "test2@example.nl"),
    ]);
    expect(new Set([base, ...variants]).size).toBe(6);
  });

  it("is not a plain SHA-256 of the value", async () => {
    const plain = toHex(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("test@example.nl"))),
    );
    expect(await digest(SCOPE)).not.toBe(plain);
  });

  it("produces non-extractable, sign-only keys", async () => {
    const key = await deriveIndexKey(ROOT, SCOPE);
    expect(key.extractable).toBe(false);
    expect(key.usages).toEqual(["sign"]);
    await expect(crypto.subtle.exportKey("raw", key)).rejects.toBeInstanceOf(Error);
  });

  it("does not modify the caller's root key", async () => {
    const root = ROOT.slice();
    await deriveIndexKey(root, SCOPE);
    expect(root).toEqual(ROOT);
  });

  it("rejects invalid input", async () => {
    await expect(deriveIndexKey(new Uint8Array(16), SCOPE)).rejects.toBeInstanceOf(CryptoInputError);
    await expect(deriveIndexKey(ROOT, { ...SCOPE, organizationId: "x" })).rejects.toBeInstanceOf(CryptoInputError);
    await expect(deriveIndexKey(ROOT, { ...SCOPE, fieldCode: "E-mail" })).rejects.toBeInstanceOf(CryptoInputError);
    await expect(deriveIndexKey(ROOT, { ...SCOPE, indexVersion: 0 })).rejects.toBeInstanceOf(CryptoInputError);
    const key = await deriveIndexKey(ROOT, SCOPE);
    await expect(blindIndex(key, "")).rejects.toBeInstanceOf(CryptoInputError);
    const aes = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    await expect(blindIndex(aes, "value")).rejects.toBeInstanceOf(CryptoInputError);
  });
});
