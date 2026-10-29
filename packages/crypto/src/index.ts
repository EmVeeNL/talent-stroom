// Public entry point of @talentstroom/crypto. Only this file may be imported by other packages.
// The package never logs: no console, no telemetry. See README.md and docs/adr/0011.
export {
  CryptoError,
  CryptoInputError,
  CryptoIntegrityError,
  EnvelopeFormatError,
  ForbiddenEnvironmentError,
  KmsUnavailableError,
  NormalizationError,
  type CryptoErrorCode,
} from "./errors.ts";
export type { KeyManagementService, UnwrapKeyResult, WrapKeyResult } from "./kms.ts";
export { createLocalKms, type LocalKms, type LocalKmsOptions } from "./local-kms.ts";
export {
  ENVELOPE_ALGORITHM,
  ENVELOPE_FORMAT_VERSION,
  MAX_PLAINTEXT_BYTES,
  parseEnvelope,
  serializeEnvelope,
  type EncryptedEnvelope,
} from "./format.ts";
export {
  decryptRecord,
  encryptRecord,
  rewrapRecord,
  type DecryptedJson,
  type DecryptedRecord,
  type EncryptDeps,
  type EnvelopeDeps,
  type JsonValue,
  type RecordContext,
  type RecordPlaintext,
} from "./envelope.ts";
export { BLIND_INDEX_BYTES, blindIndex, deriveIndexKey, type IndexKeyScope } from "./blind-index.ts";
export { normalizeEmail, normalizePhone } from "./normalize.ts";
