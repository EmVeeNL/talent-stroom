import {
  type Bytes,
  canonicalUuid,
  copyBytes,
  encodeFields,
  environmentName,
  identifier,
  kekReference,
  version,
  wipe,
} from "./encoding.ts";
import { type CryptoError, CryptoInputError, CryptoIntegrityError, KmsUnavailableError } from "./errors.ts";
import {
  DEK_BYTES,
  ENVELOPE_ALGORITHM,
  ENVELOPE_ALGORITHM_ID,
  ENVELOPE_FORMAT_VERSION,
  type EncryptedEnvelope,
  MAX_PLAINTEXT_BYTES,
  MAX_WRAPPED_DEK_BYTES,
  NONCE_BYTES,
  checkEnvelope,
} from "./format.ts";
import type { KeyManagementService } from "./kms.ts";

/**
 * Identity of the record being encrypted. All fields are authenticated as AAD, so ciphertext moved
 * to another organization, record, record type or schema version fails to decrypt.
 *
 * On decrypt, build the context from trusted request state (the authenticated organization and the
 * requested record id), not from columns of the row being decrypted.
 */
export interface RecordContext {
  /** Organization UUID (case-insensitive; canonicalized to lowercase). */
  readonly organizationId: string;
  /** Record type, `[a-z][a-z0-9_]{0,63}`, e.g. `candidate_private`. */
  readonly recordType: string;
  /** Record UUID (case-insensitive; canonicalized to lowercase). */
  readonly recordId: string;
  /** Payload schema version, integer 1..2^32-1 (`payload_schema_version`). */
  readonly schemaVersion: number;
}

/** Dependencies for decrypting and rewrapping. */
export interface EnvelopeDeps {
  /** KMS adapter, or the local fake KMS outside production. */
  readonly kms: KeyManagementService;
  /** Deployment environment, `[a-z][a-z0-9-]{0,31}` (e.g. `production`); authenticated as AAD. */
  readonly environment: string;
}

/** Dependencies for encrypting: adds the KEK to wrap the new DEK with. */
export interface EncryptDeps extends EnvelopeDeps {
  /** KEK reference of the record's organization (per-organization KEKs, ADR 0008). */
  readonly kekRef: string;
}

/** Plaintext accepted by {@link encryptRecord}. */
export type RecordPlaintext = Uint8Array | JsonValue;

/** JSON-serialisable value. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Result of {@link decryptRecord}: the plaintext in the form it was encrypted. */
export type DecryptedRecord = { readonly kind: "bytes"; readonly bytes: Uint8Array } | DecryptedJson;

/** JSON plaintext returned by {@link decryptRecord}. */
export interface DecryptedJson {
  readonly kind: "json";
  readonly value: unknown;
}

// Payload kind byte, prepended to the plaintext before encryption (so it is confidential and
// authenticated).
const KIND_BYTES = 0x00;
const KIND_JSON = 0x01;

interface CheckedContext {
  readonly organizationId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly schemaVersion: number;
}

function checkContext(context: RecordContext): CheckedContext {
  if (typeof context !== "object" || context === null) throw new CryptoInputError("context");
  return {
    organizationId: canonicalUuid(context.organizationId, "organizationId"),
    recordType: identifier(context.recordType, "recordType"),
    recordId: canonicalUuid(context.recordId, "recordId"),
    schemaVersion: version(context.schemaVersion, "schemaVersion"),
  };
}

/**
 * AAD for the record AEAD (see ADR 0011). Length-prefixed fields:
 * `ts:v1`, `record`, environment, organizationId, recordType, recordId, schemaVersion,
 * formatVersion, algorithmId. Excludes the KEK reference and version so a rewrap leaves the record
 * ciphertext valid.
 */
function recordAad(environment: string, ctx: CheckedContext): Bytes {
  return encodeFields([
    "ts:v1",
    "record",
    environment,
    ctx.organizationId,
    ctx.recordType,
    ctx.recordId,
    String(ctx.schemaVersion),
    String(ENVELOPE_FORMAT_VERSION),
    String(ENVELOPE_ALGORITHM_ID),
  ]);
}

/**
 * AAD passed to the KMS when wrapping/unwrapping the DEK (see ADR 0011). Length-prefixed fields:
 * `ts:v1`, `dek`, environment, organizationId, recordType, recordId, schemaVersion, kekRef.
 */
function dekAad(environment: string, ctx: CheckedContext, kekRef: string): Bytes {
  return encodeFields([
    "ts:v1",
    "dek",
    environment,
    ctx.organizationId,
    ctx.recordType,
    ctx.recordId,
    String(ctx.schemaVersion),
    kekRef,
  ]);
}

function checkKms(kms: KeyManagementService): KeyManagementService {
  // Runtime guard for untyped callers.
  if (typeof kms?.wrapKey !== "function" || typeof kms.unwrapKey !== "function") throw new CryptoInputError("kms");
  return kms;
}

/** Maps anything a KMS adapter throws to a fresh, data-free error. Unknown failures fail closed. */
function kmsFailure(error: unknown): CryptoError {
  return error instanceof CryptoIntegrityError ? new CryptoIntegrityError() : new KmsUnavailableError();
}

async function wrapDek(kms: KeyManagementService, kekRef: string, rawDek: Bytes, aad: Bytes) {
  let result;
  try {
    result = await kms.wrapKey(kekRef, rawDek, aad);
  } catch (error) {
    throw kmsFailure(error);
  }
  const wrapped = result?.wrappedKey;
  if (
    !(wrapped instanceof Uint8Array) ||
    wrapped.byteLength < 1 ||
    wrapped.byteLength > MAX_WRAPPED_DEK_BYTES ||
    !Number.isInteger(result.keyVersion) ||
    result.keyVersion < 1 ||
    result.keyVersion > 0xffffffff
  ) {
    throw new KmsUnavailableError();
  }
  return { wrappedDek: copyBytes(wrapped), keyVersion: result.keyVersion };
}

/** Unwraps the DEK and imports it as a non-extractable AES-GCM key; zeroes the raw bytes. */
async function unwrapDek(
  kms: KeyManagementService,
  envelope: EncryptedEnvelope,
  aad: Bytes,
  usage: "decrypt" | "none",
): Promise<{ key?: CryptoKey; raw?: Bytes }> {
  let result;
  try {
    result = await kms.unwrapKey(envelope.kekRef, envelope.wrappedDek, aad);
  } catch (error) {
    throw kmsFailure(error);
  }
  const raw = result?.key instanceof Uint8Array ? copyBytes(result.key) : undefined;
  wipe(result?.key);
  if (raw === undefined || raw.byteLength !== DEK_BYTES || result.keyVersion !== envelope.keyVersion) {
    wipe(raw);
    throw new CryptoIntegrityError();
  }
  if (usage === "none") return { raw };
  try {
    return { key: await importDek(raw, "decrypt") };
  } finally {
    wipe(raw);
  }
}

function importDek(raw: Bytes, usage: "encrypt" | "decrypt"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM", length: 256 }, false, [usage]);
}

function encodePlaintext(plaintext: RecordPlaintext): Bytes {
  let body: Uint8Array;
  let kind: number;
  if (plaintext instanceof Uint8Array) {
    body = plaintext;
    kind = KIND_BYTES;
  } else {
    let json: string | undefined;
    try {
      json = JSON.stringify(plaintext);
    } catch {
      throw new CryptoInputError("plaintext");
    }
    if (typeof json !== "string") throw new CryptoInputError("plaintext");
    body = new TextEncoder().encode(json);
    kind = KIND_JSON;
  }
  if (body.byteLength > MAX_PLAINTEXT_BYTES) {
    if (kind === KIND_JSON) wipe(body);
    throw new CryptoInputError("plaintext");
  }
  const out = new Uint8Array(1 + body.byteLength);
  out[0] = kind;
  out.set(body, 1);
  if (kind === KIND_JSON) wipe(body);
  return out;
}

/**
 * Encrypts one record with a fresh random 256-bit DEK (AES-256-GCM, fresh random 96-bit nonce),
 * binds the record context and environment as AAD, and wraps the DEK with the organization's KEK.
 * Each call uses a new DEK, so a DEK never encrypts twice; to update a record, encrypt again.
 *
 * Safe usage:
 * - Authorize first (membership, permission, organization scope); then encrypt.
 * - Never call inside a database transaction (ADR 0007): encrypt, then open the transaction and
 *   write the envelope.
 * - Fails closed: on {@link KmsUnavailableError} reject the write; never store plaintext instead.
 * - The caller still holds the plaintext: drop references promptly and never log, cache or queue it.
 *   A `Uint8Array` plaintext is not modified; JSON is serialized with `JSON.stringify`.
 *
 * @throws {CryptoInputError} invalid context, environment, KEK reference or plaintext (> 1 MiB).
 * @throws {KmsUnavailableError} the KMS could not wrap the DEK.
 */
export async function encryptRecord(
  context: RecordContext,
  plaintext: RecordPlaintext,
  deps: EncryptDeps,
): Promise<EncryptedEnvelope> {
  const ctx = checkContext(context);
  const environment = environmentName(deps?.environment);
  const kekRef = kekReference(deps.kekRef);
  const kms = checkKms(deps.kms);
  const payload = encodePlaintext(plaintext);
  const rawDek = crypto.getRandomValues(new Uint8Array(DEK_BYTES));
  try {
    const { wrappedDek, keyVersion } = await wrapDek(kms, kekRef, rawDek, dekAad(environment, ctx, kekRef));
    const dek = await importDek(rawDek, "encrypt");
    wipe(rawDek);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: nonce, additionalData: recordAad(environment, ctx), tagLength: 128 },
        dek,
        payload,
      ),
    );
    return {
      formatVersion: ENVELOPE_FORMAT_VERSION,
      algorithm: ENVELOPE_ALGORITHM,
      kekRef,
      keyVersion,
      wrappedDek,
      nonce,
      ciphertext,
    };
  } finally {
    wipe(rawDek);
    wipe(payload);
  }
}

/**
 * Unwraps the DEK through the KMS and decrypts and authenticates one record.
 *
 * Safe usage:
 * - Authorize first, and build `context` from trusted request state (authenticated organization,
 *   requested record id), not from the row itself.
 * - Never call inside a database transaction (ADR 0007): read and commit first, then decrypt.
 * - Never cache decrypted plaintext (KV, Cache API, Durable Objects, queues) and never log it.
 *   Return only the fields the caller needs.
 * - {@link CryptoIntegrityError} means wrong context or tampering: return a generic error and record
 *   a security event with the record id only. {@link KmsUnavailableError}: return 503, no fallback.
 *
 * Returned `bytes` (kind `bytes`) are owned by the caller; zero them when done if feasible.
 *
 * @throws {CryptoInputError} invalid context or environment.
 * @throws {EnvelopeFormatError} malformed envelope.
 * @throws {CryptoIntegrityError} authentication failed.
 * @throws {KmsUnavailableError} the KMS could not unwrap the DEK.
 */
export async function decryptRecord(
  context: RecordContext,
  envelope: EncryptedEnvelope,
  deps: EnvelopeDeps,
): Promise<DecryptedRecord> {
  const ctx = checkContext(context);
  const environment = environmentName(deps?.environment);
  const kms = checkKms(deps.kms);
  const checked = checkEnvelope(envelope);
  const { key } = await unwrapDek(kms, checked, dekAad(environment, ctx, checked.kekRef), "decrypt");
  if (key === undefined) throw new CryptoIntegrityError();

  let payload: Bytes;
  try {
    payload = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: checked.nonce, additionalData: recordAad(environment, ctx), tagLength: 128 },
        key,
        checked.ciphertext,
      ),
    );
  } catch {
    throw new CryptoIntegrityError();
  }

  const kind = payload[0];
  if (kind === KIND_BYTES) {
    const bytes = payload.slice(1);
    wipe(payload);
    return { kind: "bytes", bytes };
  }
  try {
    if (kind !== KIND_JSON) throw new CryptoIntegrityError();
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(payload.subarray(1));
    return { kind: "json", value: JSON.parse(text) as unknown };
  } catch {
    throw new CryptoIntegrityError();
  } finally {
    wipe(payload);
  }
}

/**
 * Rewraps a record's DEK under `newKekRef` (or under the new primary version of the same KEK after
 * rotation) without touching the record ciphertext or nonce, and without ever seeing the record
 * plaintext. The old envelope stays decryptable until the old KEK version is disabled; write the new
 * envelope (with optimistic concurrency on the row) before disabling.
 *
 * Use only for KEK rotation or provider migration. After a suspected DEK or KEK compromise,
 * rewrapping is not enough: decrypt and re-encrypt with {@link encryptRecord} (new DEK).
 * Never call inside a database transaction (ADR 0007).
 *
 * @throws {CryptoInputError} invalid context, environment or KEK reference.
 * @throws {EnvelopeFormatError} malformed envelope.
 * @throws {CryptoIntegrityError} the DEK could not be authenticated with this context.
 * @throws {KmsUnavailableError} the KMS could not unwrap or wrap.
 */
export async function rewrapRecord(
  context: RecordContext,
  envelope: EncryptedEnvelope,
  newKekRef: string,
  deps: EnvelopeDeps,
): Promise<EncryptedEnvelope> {
  const ctx = checkContext(context);
  const environment = environmentName(deps?.environment);
  const kms = checkKms(deps.kms);
  const kekRef = kekReference(newKekRef, "newKekRef");
  const checked = checkEnvelope(envelope);
  const { raw } = await unwrapDek(kms, checked, dekAad(environment, ctx, checked.kekRef), "none");
  if (raw === undefined) throw new CryptoIntegrityError();
  try {
    const { wrappedDek, keyVersion } = await wrapDek(kms, kekRef, raw, dekAad(environment, ctx, kekRef));
    return { ...checked, kekRef, keyVersion, wrappedDek };
  } finally {
    wipe(raw);
  }
}
