// Internal helpers: byte handling, injective field encoding and input validation. Not exported
// from the package entry point.
import { CryptoInputError } from "./errors.ts";

/** Byte array backed by a plain ArrayBuffer (what Web Crypto accepts as BufferSource). */
export type Bytes = Uint8Array<ArrayBuffer>;

const utf8 = new TextEncoder();

/** Copies any Uint8Array into a fresh, ArrayBuffer-backed array that this package owns. */
export function copyBytes(input: Uint8Array): Bytes {
  const out = new Uint8Array(input.byteLength);
  out.set(input);
  return out;
}

/** Overwrites a buffer with zeros (best effort; JS cannot guarantee no other copies exist). */
export function wipe(buffer: Uint8Array | undefined): void {
  buffer?.fill(0);
}

export function utf8Encode(value: string): Bytes {
  return utf8.encode(value);
}

/**
 * Injective encoding of a fixed sequence of string fields:
 * `u16be(byteLength(f1)) || utf8(f1) || u16be(byteLength(f2)) || utf8(f2) || ...`.
 * Two different sequences never produce the same bytes (each field's length is explicit).
 */
export function encodeFields(fields: readonly string[]): Bytes {
  const encoded = fields.map((field) => utf8.encode(field));
  const total = encoded.reduce((sum, bytes) => sum + 2 + bytes.byteLength, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let offset = 0;
  for (const bytes of encoded) {
    if (bytes.byteLength > 0xffff) throw new CryptoInputError("field");
    view.setUint16(offset, bytes.byteLength);
    out.set(bytes, offset + 2);
    offset += 2 + bytes.byteLength;
  }
  return out;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const IDENTIFIER = /^[a-z][a-z0-9_]{0,63}$/;
const ENVIRONMENT = /^[a-z][a-z0-9-]{0,31}$/;
// Provider key names such as `projects/p/locations/l/keyRings/r/cryptoKeys/k`, ARNs or `org-...`.
const KEK_REF = /^[A-Za-z0-9][A-Za-z0-9._:/@+=-]{0,255}$/;

/** Validates a UUID and returns its canonical lowercase form (used in AAD). */
export function canonicalUuid(value: unknown, parameter: string): string {
  if (typeof value !== "string") throw new CryptoInputError(parameter);
  const lower = value.toLowerCase();
  if (!UUID.test(lower)) throw new CryptoInputError(parameter);
  return lower;
}

/** Lowercase identifier `[a-z][a-z0-9_]{0,63}` (record types, field codes). */
export function identifier(value: unknown, parameter: string): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) throw new CryptoInputError(parameter);
  return value;
}

/** Environment name `[a-z][a-z0-9-]{0,31}`, e.g. `production`, `staging`, `dev`, `test`. */
export function environmentName(value: unknown): string {
  if (typeof value !== "string" || !ENVIRONMENT.test(value)) throw new CryptoInputError("environment");
  return value;
}

/** KMS key reference: printable ASCII subset, 1..256 characters, no whitespace. */
export function kekReference(value: unknown, parameter = "kekRef"): string {
  if (typeof value !== "string" || !KEK_REF.test(value)) throw new CryptoInputError(parameter);
  return value;
}

/** Integer in 1..2^32-1 (schema, key and index versions). */
export function version(value: unknown, parameter: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 0xffffffff) {
    throw new CryptoInputError(parameter);
  }
  return value;
}

/** Constant-time comparison of two byte arrays (length is not secret). */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
