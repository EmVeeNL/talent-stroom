import { canonicalUuid, copyBytes, encodeFields, identifier, version, wipe } from "./encoding.ts";
import { CryptoInputError } from "./errors.ts";

/** Scope of one blind-index key. */
export interface IndexKeyScope {
  /** Organization UUID (case-insensitive; canonicalized to lowercase). */
  readonly organizationId: string;
  /** Indexed field, `[a-z][a-z0-9_]{0,63}`, e.g. `email` or `phone` (`field_code`). */
  readonly fieldCode: string;
  /** Index key version, integer 1..2^32-1 (`index_version`). Bump to rotate and reindex. */
  readonly indexVersion: number;
}

/** Length of a blind-index digest in bytes (full HMAC-SHA-256 output). */
export const BLIND_INDEX_BYTES = 32;

/**
 * Derives the blind-index key for one organization, field and index version:
 * `HKDF-SHA-256(ikm = root, salt = empty, info = fields("ts:v1", "bidx", organizationId, fieldCode,
 * indexVersion))` → non-extractable HMAC-SHA-256 key (256-bit), usable only to sign.
 *
 * `rootKeyBytes` is the per-environment blind-index root (exactly 32 random bytes), unwrapped from
 * the KMS by the caller. This function copies it, zeroes its copy, and never keeps it; the caller
 * should zero its own buffer after deriving the keys it needs. The derived `CryptoKey` may be held
 * in isolate memory for a short TTL (ADR 0008), never in KV, Cache API or storage.
 *
 * @throws {CryptoInputError} invalid root key or scope.
 */
export async function deriveIndexKey(rootKeyBytes: Uint8Array, scope: IndexKeyScope): Promise<CryptoKey> {
  if (!(rootKeyBytes instanceof Uint8Array) || rootKeyBytes.byteLength !== 32) throw new CryptoInputError("rootKey");
  if (typeof scope !== "object" || scope === null) throw new CryptoInputError("scope");
  const info = encodeFields([
    "ts:v1",
    "bidx",
    canonicalUuid(scope.organizationId, "organizationId"),
    identifier(scope.fieldCode, "fieldCode"),
    String(version(scope.indexVersion, "indexVersion")),
  ]);
  const root = copyBytes(rootKeyBytes);
  let hkdf: CryptoKey;
  try {
    hkdf = await crypto.subtle.importKey("raw", root, "HKDF", false, ["deriveKey"]);
  } finally {
    wipe(root);
  }
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info },
    hkdf,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
}

/**
 * Computes the blind index (HMAC-SHA-256, 32 bytes) of an already normalized value, for exact-match
 * lookup in `candidate_blind_indexes.digest`. Normalize first with {@link normalizeEmail} or
 * {@link normalizePhone}; the same input must always be normalized the same way.
 *
 * A blind index reveals equality of values within one organization, field and index version, and
 * is open to offline guessing by anyone holding the derived key. Never log the input or the
 * digest together with the input. Never call inside a database transaction if the key must first
 * be unwrapped from the KMS (ADR 0007).
 *
 * @throws {CryptoInputError} empty value or key not usable for HMAC signing.
 */
export async function blindIndex(key: CryptoKey, normalizedValue: string): Promise<Uint8Array> {
  if (typeof normalizedValue !== "string" || normalizedValue.length === 0) throw new CryptoInputError("value");
  if (key?.algorithm?.name !== "HMAC" || !key.usages.includes("sign")) throw new CryptoInputError("key");
  const data = new TextEncoder().encode(normalizedValue);
  try {
    return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  } finally {
    wipe(data);
  }
}
