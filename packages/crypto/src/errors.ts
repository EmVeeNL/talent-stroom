/**
 * Error hierarchy for `@talentstroom/crypto`.
 *
 * Every error carries a fixed, static message and a machine-readable `code`. Messages never contain
 * plaintext, key material, ciphertext, wrapped keys, key references or record identifiers, and no
 * underlying error is attached as `cause` (provider errors may echo request data). Callers map these
 * to HTTP responses: {@link KmsUnavailableError} to 503, {@link CryptoIntegrityError} to 500 plus a
 * security event, {@link CryptoInputError} to 400/500 depending on the source of the input.
 */

/** Machine-readable error codes. Safe to log and to put in metrics. */
export type CryptoErrorCode =
  | "kms_unavailable"
  | "integrity_failure"
  | "envelope_format"
  | "invalid_input"
  | "normalization_failed"
  | "forbidden_environment";

/**
 * Base class of every error thrown by this package. Safe to log: the message is static and
 * contains no secrets or personal data. Never add data to these errors when re-throwing.
 */
export class CryptoError extends Error {
  /** Stable code for metrics and error mapping. */
  readonly code: CryptoErrorCode;

  constructor(code: CryptoErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

/**
 * The KMS could not be reached or refused the request for an operational reason (outage, timeout,
 * quota, credentials). Fail closed: never fall back to storing or returning plaintext. Retryable
 * with bounded back-off.
 */
export class KmsUnavailableError extends CryptoError {
  constructor() {
    super("kms_unavailable", "Key management service unavailable");
  }
}

/**
 * Authenticated decryption or unwrapping failed: wrong key, wrong context (AAD), tampered
 * ciphertext, nonce, tag or wrapped key, or a disabled key version. Not retryable. Treat as a
 * possible attack and record a security event (without the envelope bytes).
 */
export class CryptoIntegrityError extends CryptoError {
  constructor(code: "integrity_failure" | "envelope_format" = "integrity_failure", message = "Integrity check failed") {
    super(code, message);
  }
}

/** A serialized envelope is malformed (unknown version, wrong length, trailing bytes, ...). */
export class EnvelopeFormatError extends CryptoIntegrityError {
  constructor() {
    super("envelope_format", "Malformed encryption envelope");
  }
}

/**
 * An argument is invalid (malformed UUID, unsupported value, oversized payload, unserialisable
 * JSON). The message names the parameter, never its value.
 */
export class CryptoInputError extends CryptoError {
  constructor(parameter: string) {
    super("invalid_input", `Invalid crypto input: ${parameter}`);
  }
}

/** A value (email, phone number) cannot be normalized confidently for a blind index. */
export class NormalizationError extends CryptoError {
  constructor(kind: "email" | "phone") {
    super("normalization_failed", `Value cannot be normalized: ${kind}`);
  }
}

/** The local fake KMS was asked to run in production. */
export class ForbiddenEnvironmentError extends CryptoError {
  constructor() {
    super("forbidden_environment", "The local KMS must not be used in production");
  }
}
