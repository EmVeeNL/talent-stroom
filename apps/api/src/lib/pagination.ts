import { z } from "zod";

export interface CursorKey {
  createdAt: string;
  id: string;
}

export interface PageError {
  ok: false;
  error: { code: "invalid_limit" | "invalid_cursor" };
}

export type PageParamsResult = { ok: true; limit: number; cursor?: string } | PageError;

export type CursorResult = { ok: true; key: CursorKey } | PageError;

const cursorSchema = z.strictObject({
  v: z.literal(1),
  createdAt: z.iso.datetime().max(64),
  id: z.uuid(),
});

function invalidCursor(): PageError {
  return { ok: false, error: { code: "invalid_cursor" } };
}

function validLimit(limit: number): boolean {
  return Number.isInteger(limit) && limit >= 1 && limit <= 100;
}

/** Parse `c.req.query()` before fetching rows. Reject invalid limits rather than silently clamping.
 * Pass a present cursor to `decodeCursor` before using its key in a scoped database query.
 */
export function parsePageParams(query: Readonly<Record<string, unknown>>): PageParamsResult {
  const rawLimit = query["limit"];
  const limit =
    rawLimit === undefined ? 25 : typeof rawLimit === "string" && /^[0-9]+$/.test(rawLimit) ? Number(rawLimit) : NaN;
  if (!validLimit(limit)) {
    return { ok: false, error: { code: "invalid_limit" } };
  }
  const cursor = query["cursor"];
  if (cursor === undefined) return { ok: true, limit };
  if (typeof cursor !== "string" || cursor.length === 0 || cursor.length > 512) {
    return invalidCursor();
  }
  return { ok: true, limit, cursor };
}

function toBase64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64url(encoded: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error("Invalid base64url");
  const bytes = Uint8Array.from(atob(encoded.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));
  // Reject noncanonical encodings, including nonzero unused trailing bits.
  if (toBase64url(bytes) !== encoded) throw new Error("Invalid base64url");
  return bytes;
}

function requireSigningKey(key: CryptoKey): void {
  const algorithm = key.algorithm;
  if (algorithm.name !== "HMAC" || !("hash" in algorithm) || algorithm.hash?.name !== "SHA-256") {
    throw new TypeError("Cursor key must use HMAC-SHA-256");
  }
}

/** Encode a database key as `base64url({v,createdAt,id}).base64url(HMAC)`.
 * Pass a caller-owned HMAC-SHA-256 CryptoKey imported from a Worker secret (sign/verify usages).
 * Only UTC timestamps and UUIDs enter the payload; it is signed, not encrypted. Never pass personal data.
 */
export async function encodeCursor(key: CursorKey, signingKey: CryptoKey): Promise<string> {
  requireSigningKey(signingKey);
  // Explicit projection prevents row fields from leaking when getKey returns a complete row.
  const payload = cursorSchema.safeParse({ v: 1, createdAt: key.createdAt, id: key.id });
  if (!payload.success) throw new TypeError("Invalid cursor key");
  const encoded = toBase64url(new TextEncoder().encode(JSON.stringify(payload.data)));
  const signature = await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(encoded));
  return `${encoded}.${toBase64url(new Uint8Array(signature))}`;
}

/** Verify an untrusted cursor with Web Crypto before using its key for pagination.
 * Invalid input returns a safe error code; key/configuration failures throw. A cursor grants no authorization.
 */
export async function decodeCursor(cursor: string, signingKey: CryptoKey): Promise<CursorResult> {
  requireSigningKey(signingKey);
  if (cursor.length > 512) return invalidCursor();
  const parts = cursor.split(".");
  const [encoded, encodedSignature] = parts;
  if (parts.length !== 2 || !encoded || !encodedSignature) return invalidCursor();

  let payload: Uint8Array<ArrayBuffer>;
  let signature: Uint8Array<ArrayBuffer>;
  try {
    payload = fromBase64url(encoded);
    signature = fromBase64url(encodedSignature);
  } catch {
    return invalidCursor();
  }
  if (signature.length !== 32) return invalidCursor();
  if (!(await crypto.subtle.verify("HMAC", signingKey, signature, new TextEncoder().encode(encoded)))) {
    return invalidCursor();
  }
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(payload)),
    );
    if (!parsed.success) return invalidCursor();
    return { ok: true, key: { createdAt: parsed.data.createdAt, id: parsed.data.id } };
  } catch {
    return invalidCursor();
  }
}

/** Fetch `limit + 1` rows ordered consistently by `(createdAt, id)`, then await this helper.
 * The cursor uses the last returned row, preserving timestamp precision. Apply the same order and
 * keyset predicate on the next scoped query. Invalid internal limits/keys throw programming errors.
 */
export async function buildPage<T>(
  items: readonly T[],
  limit: number,
  getKey: (item: T) => CursorKey,
  signingKey: CryptoKey,
): Promise<{ data: T[]; nextCursor: string | null }> {
  if (!validLimit(limit)) throw new RangeError("Page limit must be an integer from 1 to 100");
  const data = items.slice(0, limit);
  const last = data.at(-1);
  const nextCursor = items.length > limit && last !== undefined ? await encodeCursor(getKey(last), signingKey) : null;
  return { data, nextCursor };
}
