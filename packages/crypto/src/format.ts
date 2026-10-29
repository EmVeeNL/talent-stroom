import { type Bytes, copyBytes, kekReference, utf8Encode } from "./encoding.ts";
import { CryptoInputError, EnvelopeFormatError } from "./errors.ts";

/** Current envelope format version (first byte of the serialized form). */
export const ENVELOPE_FORMAT_VERSION = 1;
/** Algorithm name stored with every envelope; matches the `cipher` column default. */
export const ENVELOPE_ALGORITHM = "AES-256-GCM";
/** Numeric id of {@link ENVELOPE_ALGORITHM} in the binary format. */
export const ENVELOPE_ALGORITHM_ID = 1;
/** AES-GCM nonce length in bytes (96 bits). */
export const NONCE_BYTES = 12;
/** AES-GCM authentication tag length in bytes (128 bits). */
export const TAG_BYTES = 16;
/** Data encryption key length in bytes (256 bits). */
export const DEK_BYTES = 32;
/** Largest plaintext accepted by {@link encryptRecord} (1 MiB). Larger blobs need a file format. */
export const MAX_PLAINTEXT_BYTES = 1024 * 1024;
/** Largest wrapped DEK accepted from a KMS or a stored envelope. */
export const MAX_WRAPPED_DEK_BYTES = 1024;

// One byte of payload kind is prepended to the plaintext before encryption (see envelope.ts).
const MIN_CIPHERTEXT_BYTES = 1 + TAG_BYTES;
const MAX_CIPHERTEXT_BYTES = 1 + MAX_PLAINTEXT_BYTES + TAG_BYTES;
const MAX_KEK_REF_BYTES = 256;

/**
 * Envelope for one encrypted record. Everything in it is safe to store in the database: it holds
 * no plaintext, no raw key and no KEK. Map to columns as `kekRef` → `kms_key_ref`, `keyVersion` →
 * `wrapping_version`, `wrappedDek` → `wrapped_dek`, `algorithm` → `cipher`, `ciphertext` →
 * `encrypted_payload` (includes the GCM tag), `nonce` → `nonce`; or store the whole envelope as one
 * `bytea` via {@link serializeEnvelope}.
 *
 * Decrypting it also requires the record context (organization, type, id, schema version) and the
 * environment, which are authenticated as AAD but not stored inside the envelope.
 */
export interface EncryptedEnvelope {
  readonly formatVersion: typeof ENVELOPE_FORMAT_VERSION;
  readonly algorithm: typeof ENVELOPE_ALGORITHM;
  /** Provider reference of the KEK that wrapped the DEK (no personal data). */
  readonly kekRef: string;
  /** KEK version that wrapped the DEK. */
  readonly keyVersion: number;
  /** DEK wrapped by the KMS. */
  readonly wrappedDek: Uint8Array;
  /** 96-bit AES-GCM nonce, random per encryption. */
  readonly nonce: Uint8Array;
  /** AES-256-GCM ciphertext followed by the 128-bit tag. */
  readonly ciphertext: Uint8Array;
}

/** Validated envelope with package-owned, ArrayBuffer-backed copies. @internal */
export interface CheckedEnvelope extends EncryptedEnvelope {
  readonly wrappedDek: Bytes;
  readonly nonce: Bytes;
  readonly ciphertext: Bytes;
}

/**
 * Validates an envelope object (for example rebuilt from separate database columns) and returns a
 * defensive copy. Throws {@link EnvelopeFormatError} on any deviation.
 * @internal
 */
export function checkEnvelope(envelope: EncryptedEnvelope): CheckedEnvelope {
  if (typeof envelope !== "object" || envelope === null) throw new EnvelopeFormatError();
  const { formatVersion, algorithm, kekRef, keyVersion, wrappedDek, nonce, ciphertext } = envelope;
  if (formatVersion !== ENVELOPE_FORMAT_VERSION || algorithm !== ENVELOPE_ALGORITHM) throw new EnvelopeFormatError();
  try {
    kekReference(kekRef);
  } catch {
    throw new EnvelopeFormatError();
  }
  if (!Number.isInteger(keyVersion) || keyVersion < 1 || keyVersion > 0xffffffff) throw new EnvelopeFormatError();
  if (
    !(wrappedDek instanceof Uint8Array) ||
    wrappedDek.byteLength < 1 ||
    wrappedDek.byteLength > MAX_WRAPPED_DEK_BYTES ||
    !(nonce instanceof Uint8Array) ||
    nonce.byteLength !== NONCE_BYTES ||
    !(ciphertext instanceof Uint8Array) ||
    ciphertext.byteLength < MIN_CIPHERTEXT_BYTES ||
    ciphertext.byteLength > MAX_CIPHERTEXT_BYTES
  ) {
    throw new EnvelopeFormatError();
  }
  return {
    formatVersion,
    algorithm,
    kekRef,
    keyVersion,
    wrappedDek: copyBytes(wrappedDek),
    nonce: copyBytes(nonce),
    ciphertext: copyBytes(ciphertext),
  };
}

/**
 * Serializes an envelope to the compact binary format v1 (big-endian integers):
 *
 * ```
 * u8  formatVersion = 0x01
 * u8  algorithmId   = 0x01 (AES-256-GCM, 96-bit nonce, 128-bit tag)
 * u32 keyVersion    (1..2^32-1)
 * u16 kekRefLength  (1..256)      || kekRef (ASCII)
 * u16 wrappedLength (1..1024)     || wrappedDek
 * 12  nonce
 * u32 ciphertextLength (17..2^20+17) || ciphertext (incl. tag)
 * ```
 *
 * The output contains no plaintext and no raw key; it is the value to store as `bytea`.
 *
 * @throws {EnvelopeFormatError} when the envelope is invalid.
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): Uint8Array {
  const checked = checkEnvelope(envelope);
  const kekRef = utf8Encode(checked.kekRef);
  if (kekRef.byteLength > MAX_KEK_REF_BYTES) throw new CryptoInputError("kekRef");
  const size =
    1 +
    1 +
    4 +
    2 +
    kekRef.byteLength +
    2 +
    checked.wrappedDek.byteLength +
    NONCE_BYTES +
    4 +
    checked.ciphertext.byteLength;
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let offset = 0;
  view.setUint8(offset, ENVELOPE_FORMAT_VERSION);
  view.setUint8(offset + 1, ENVELOPE_ALGORITHM_ID);
  view.setUint32(offset + 2, checked.keyVersion);
  offset += 6;
  view.setUint16(offset, kekRef.byteLength);
  out.set(kekRef, offset + 2);
  offset += 2 + kekRef.byteLength;
  view.setUint16(offset, checked.wrappedDek.byteLength);
  out.set(checked.wrappedDek, offset + 2);
  offset += 2 + checked.wrappedDek.byteLength;
  out.set(checked.nonce, offset);
  offset += NONCE_BYTES;
  view.setUint32(offset, checked.ciphertext.byteLength);
  out.set(checked.ciphertext, offset + 4);
  return out;
}

/**
 * Parses the binary format produced by {@link serializeEnvelope}. Strict: rejects unknown format
 * versions and algorithm ids, out-of-range lengths, truncated input and trailing bytes. Parsing
 * does not authenticate anything; only {@link decryptRecord} does.
 *
 * @throws {EnvelopeFormatError} on any malformed input.
 */
export function parseEnvelope(bytes: Uint8Array): EncryptedEnvelope {
  if (!(bytes instanceof Uint8Array)) throw new EnvelopeFormatError();
  const input = copyBytes(bytes);
  const view = new DataView(input.buffer);
  let offset = 0;
  const need = (length: number): void => {
    if (offset + length > input.byteLength) throw new EnvelopeFormatError();
  };
  const take = (length: number): Uint8Array<ArrayBuffer> => {
    need(length);
    const slice = input.slice(offset, offset + length);
    offset += length;
    return slice;
  };

  need(6);
  if (view.getUint8(0) !== ENVELOPE_FORMAT_VERSION || view.getUint8(1) !== ENVELOPE_ALGORITHM_ID) {
    throw new EnvelopeFormatError();
  }
  const keyVersion = view.getUint32(2);
  offset = 6;
  need(2);
  const kekRefLength = view.getUint16(offset);
  offset += 2;
  if (kekRefLength < 1 || kekRefLength > MAX_KEK_REF_BYTES) throw new EnvelopeFormatError();
  let kekRef: string;
  try {
    kekRef = new TextDecoder("utf-8", { fatal: true }).decode(take(kekRefLength));
  } catch {
    throw new EnvelopeFormatError();
  }
  need(2);
  const wrappedLength = view.getUint16(offset);
  offset += 2;
  if (wrappedLength < 1 || wrappedLength > MAX_WRAPPED_DEK_BYTES) throw new EnvelopeFormatError();
  const wrappedDek = take(wrappedLength);
  const nonce = take(NONCE_BYTES);
  need(4);
  const ciphertextLength = view.getUint32(offset);
  offset += 4;
  if (ciphertextLength < MIN_CIPHERTEXT_BYTES || ciphertextLength > MAX_CIPHERTEXT_BYTES) {
    throw new EnvelopeFormatError();
  }
  const ciphertext = take(ciphertextLength);
  if (offset !== input.byteLength) throw new EnvelopeFormatError();

  return checkEnvelope({
    formatVersion: ENVELOPE_FORMAT_VERSION,
    algorithm: ENVELOPE_ALGORITHM,
    kekRef,
    keyVersion,
    wrappedDek,
    nonce,
    ciphertext,
  });
}
