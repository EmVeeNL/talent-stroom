import { type Bytes, copyBytes, encodeFields, environmentName, kekReference, version, wipe } from "./encoding.ts";
import { CryptoInputError, CryptoIntegrityError, ForbiddenEnvironmentError, KmsUnavailableError } from "./errors.ts";
import type { KeyManagementService, UnwrapKeyResult, WrapKeyResult } from "./kms.ts";

/** Options for {@link createLocalKms}. */
export interface LocalKmsOptions {
  /**
   * Environment name (`dev`, `test`, `preview`, ...). Construction fails for `production` (and
   * `prod`, any case): the local KMS keeps KEKs in process memory and has no audit trail.
   */
  readonly environment: string;
  /**
   * Optional development secret (at least 32 bytes) from which KEKs are derived with HKDF-SHA-256,
   * so data survives a dev-server restart. Without it, every KEK is random and lives only as long
   * as this instance. Use only synthetic data with a dev secret, never commit a real-looking one,
   * and never reuse it outside development. The bytes are copied and the copy is zeroed after
   * import; the caller should zero its own buffer.
   */
  readonly devSecret?: Uint8Array;
}

/**
 * Local, in-memory KMS for development and tests. Implements {@link KeyManagementService} with
 * AES-256-GCM key wrapping under a non-extractable KEK per `kekRef` and version, with the caller's
 * AAD bound into every wrap. Adds controls to simulate rotation, disabled versions and outages.
 */
export interface LocalKms extends KeyManagementService {
  /** Creates a new primary version for `kekRef` and returns its number. Old versions stay enabled. */
  rotateKey(kekRef: string): Promise<number>;
  /** Disables one version: later unwraps with it fail with {@link CryptoIntegrityError}. */
  disableKeyVersion(kekRef: string, keyVersion: number): void;
  /** `false` simulates an outage: every call throws {@link KmsUnavailableError} until set back. */
  setAvailable(available: boolean): void;
}

interface KekState {
  primary: number;
  // Promises are stored synchronously so concurrent first use of a reference or version never
  // creates two different KEKs for the same version.
  readonly versions: Map<number, Promise<CryptoKey>>;
  readonly disabled: Set<number>;
}

const WRAP_MAGIC = 0x4c; // "L"
const NONCE_BYTES = 12;
const HEADER_BYTES = 1 + 4 + NONCE_BYTES;
const TAG_BYTES = 16;
const MIN_KEY_BYTES = 16;
const MAX_KEY_BYTES = 64;
const MAX_AAD_BYTES = 64 * 1024;

function internalAad(kekRef: string, keyVersion: number, aad: Bytes): Bytes {
  const prefix = encodeFields(["ts:v1", "local-kms-wrap", kekRef, String(keyVersion)]);
  const out = new Uint8Array(prefix.byteLength + aad.byteLength);
  out.set(prefix);
  out.set(aad, prefix.byteLength);
  return out;
}

function checkAad(aad: Uint8Array): Bytes {
  if (!(aad instanceof Uint8Array) || aad.byteLength === 0 || aad.byteLength > MAX_AAD_BYTES) {
    throw new CryptoInputError("aad");
  }
  return copyBytes(aad);
}

/**
 * Creates a local fake KMS for development and tests only.
 *
 * Restrictions: rejects `environment: "production"`; keys live in process memory and are lost with
 * the instance unless a `devSecret` is given; there is no access control, audit log or HSM. Never
 * bind it in a Worker that can reach production data.
 *
 * @throws {ForbiddenEnvironmentError} when `environment` is `production` or `prod`.
 */
export async function createLocalKms(options: LocalKmsOptions): Promise<LocalKms> {
  const environment = typeof options.environment === "string" ? options.environment.trim().toLowerCase() : "";
  if (environment === "production" || environment === "prod") throw new ForbiddenEnvironmentError();
  environmentName(environment);

  let rootKey: CryptoKey | undefined;
  if (options.devSecret !== undefined) {
    if (!(options.devSecret instanceof Uint8Array) || options.devSecret.byteLength < 32) {
      throw new CryptoInputError("devSecret");
    }
    const secret = copyBytes(options.devSecret);
    try {
      rootKey = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
    } finally {
      wipe(secret);
    }
  }

  const keks = new Map<string, KekState>();
  let available = true;

  async function newKek(kekRef: string, keyVersion: number): Promise<CryptoKey> {
    if (rootKey === undefined) {
      const generated = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
        "encrypt",
        "decrypt",
      ]);
      // Symmetric generateKey yields a CryptoKey; Workers types declare the CryptoKeyPair union too.
      if ("privateKey" in generated) throw new TypeError("unexpected key pair");
      return generated;
    }
    return crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(0),
        info: encodeFields(["ts:v1", "local-kms-kek", kekRef, String(keyVersion)]),
      },
      rootKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  /** Synchronous: returns the state with a (pending) primary KEK, creating it on first use. */
  function stateFor(kekRef: string): KekState {
    let state = keks.get(kekRef);
    if (state === undefined) {
      state = { primary: 1, versions: new Map(), disabled: new Set() };
      keks.set(kekRef, state);
    }
    if (!state.versions.has(state.primary)) state.versions.set(state.primary, newKek(kekRef, state.primary));
    return state;
  }

  function kekForUnwrap(kekRef: string, keyVersion: number): Promise<CryptoKey> {
    const state = keks.get(kekRef);
    if (state?.disabled.has(keyVersion)) throw new CryptoIntegrityError();
    const existing = state?.versions.get(keyVersion);
    if (existing !== undefined) return existing;
    // Random KEKs cannot be recreated: unknown reference or version means the data is unreadable.
    if (rootKey === undefined) throw new CryptoIntegrityError();
    const derived = newKek(kekRef, keyVersion);
    stateFor(kekRef).versions.set(keyVersion, derived);
    return derived;
  }

  function ensureAvailable(): void {
    if (!available) throw new KmsUnavailableError();
  }

  return {
    async wrapKey(kekRef, rawKey, aad): Promise<WrapKeyResult> {
      ensureAvailable();
      const ref = kekReference(kekRef);
      const boundAad = checkAad(aad);
      if (!(rawKey instanceof Uint8Array) || rawKey.byteLength < MIN_KEY_BYTES || rawKey.byteLength > MAX_KEY_BYTES) {
        throw new CryptoInputError("rawKey");
      }
      const state = stateFor(ref);
      const keyVersion = state.primary;
      const pendingKek = state.versions.get(keyVersion);
      // A disabled primary cannot wrap; a real KMS would refuse the request as well.
      if (pendingKek === undefined || state.disabled.has(keyVersion)) throw new KmsUnavailableError();
      const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
      const plain = copyBytes(rawKey);
      try {
        const kek = await pendingKek;
        const sealed = new Uint8Array(
          await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: nonce, additionalData: internalAad(ref, keyVersion, boundAad), tagLength: 128 },
            kek,
            plain,
          ),
        );
        const wrappedKey = new Uint8Array(HEADER_BYTES + sealed.byteLength);
        wrappedKey[0] = WRAP_MAGIC;
        new DataView(wrappedKey.buffer).setUint32(1, keyVersion);
        wrappedKey.set(nonce, 5);
        wrappedKey.set(sealed, HEADER_BYTES);
        return { wrappedKey, keyVersion };
      } finally {
        wipe(plain);
      }
    },

    async unwrapKey(kekRef, wrappedKey, aad): Promise<UnwrapKeyResult> {
      ensureAvailable();
      const ref = kekReference(kekRef);
      const boundAad = checkAad(aad);
      if (!(wrappedKey instanceof Uint8Array)) throw new CryptoInputError("wrappedKey");
      const wrapped = copyBytes(wrappedKey);
      if (
        wrapped.byteLength < HEADER_BYTES + MIN_KEY_BYTES + TAG_BYTES ||
        wrapped.byteLength > HEADER_BYTES + MAX_KEY_BYTES + TAG_BYTES ||
        wrapped[0] !== WRAP_MAGIC
      ) {
        throw new CryptoIntegrityError();
      }
      const keyVersion = new DataView(wrapped.buffer).getUint32(1);
      if (keyVersion === 0) throw new CryptoIntegrityError();
      const kek = await kekForUnwrap(ref, keyVersion);
      try {
        const key = new Uint8Array(
          await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: wrapped.subarray(5, HEADER_BYTES),
              additionalData: internalAad(ref, keyVersion, boundAad),
              tagLength: 128,
            },
            kek,
            wrapped.subarray(HEADER_BYTES),
          ),
        );
        return { key, keyVersion };
      } catch {
        throw new CryptoIntegrityError();
      }
    },

    async rotateKey(kekRef) {
      const ref = kekReference(kekRef);
      const state = stateFor(ref);
      let next = state.primary + 1;
      while (state.versions.has(next)) next++;
      const kek = newKek(ref, next);
      state.versions.set(next, kek);
      state.primary = next;
      await kek;
      return next;
    },

    disableKeyVersion(kekRef, keyVersion) {
      const ref = kekReference(kekRef);
      const v = version(keyVersion, "keyVersion");
      let state = keks.get(ref);
      if (state === undefined) {
        state = { primary: 1, versions: new Map(), disabled: new Set() };
        keks.set(ref, state);
      }
      state.disabled.add(v);
    },

    setAvailable(value) {
      available = value;
    },
  };
}
