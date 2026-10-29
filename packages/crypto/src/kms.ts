/** Result of {@link KeyManagementService.wrapKey}. */
export interface WrapKeyResult {
  /** Opaque wrapped key bytes, safe to store in the database (1..1024 bytes). */
  readonly wrappedKey: Uint8Array;
  /** KEK version that wrapped the key, as a positive integer (1..2^32-1). */
  readonly keyVersion: number;
}

/** Result of {@link KeyManagementService.unwrapKey}. */
export interface UnwrapKeyResult {
  /**
   * The raw data key. The caller takes ownership and zeroes it after importing it; adapters must
   * not keep a reference to it.
   */
  readonly key: Uint8Array;
  /** KEK version that actually unwrapped the key, as reported by the provider. */
  readonly keyVersion: number;
}

/**
 * Provider-neutral key management interface (ADR 0008). A real adapter (Google Cloud KMS, AWS KMS,
 * ...) and the local fake KMS ({@link createLocalKms}) implement it.
 *
 * Contract for implementations:
 * - Keys are AEAD-wrapped by a KEK that lives outside the application and database. `aad` must be
 *   cryptographically bound (provider AAD / encryption context); unwrap must fail when it differs.
 * - `keyVersion` must be the version that wrapped/unwrapped the key, never a guess.
 * - Operational failures (network, timeout, 5xx, quota, auth) throw {@link KmsUnavailableError};
 *   authentication failures (wrong key, wrong AAD, tampered bytes, disabled or destroyed version)
 *   throw {@link CryptoIntegrityError}. Any other thrown value is treated as unavailability by the
 *   callers in this package (fail closed).
 * - Error messages, logs and metrics never contain the key, the wrapped key, the AAD or the
 *   provider response body.
 * - Never call it inside a database transaction (ADR 0007): fetch, commit, then call the KMS.
 */
export interface KeyManagementService {
  /** Wraps `rawKey` under the current primary version of `kekRef`, binding `aad`. */
  wrapKey(kekRef: string, rawKey: Uint8Array, aad: Uint8Array): Promise<WrapKeyResult>;
  /** Unwraps `wrappedKey` with `kekRef`; fails unless `aad` equals the AAD used to wrap. */
  unwrapKey(kekRef: string, wrappedKey: Uint8Array, aad: Uint8Array): Promise<UnwrapKeyResult>;
}
