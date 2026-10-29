# @talentstroom/crypto

Per-record envelope encryption, blind indexes and a provider-neutral KMS interface for TalentStroom. It uses Web Crypto only, so it runs unchanged on Cloudflare Workers and Node 26. There are no third-party crypto libraries. The design and byte formats are in [ADR 0011](../../docs/adr/0011-envelope-encryption-format.md); key management is in [ADR 0008](../../docs/adr/0008-key-management-kms.md).

## Usage

```ts
import {
  createLocalKms,
  decryptRecord,
  encryptRecord,
  parseEnvelope,
  serializeEnvelope,
  KmsUnavailableError,
} from "@talentstroom/crypto";

const kms = await createLocalKms({ environment: "dev" }); // a real adapter in staging/production
const context = { organizationId, recordType: "candidate_private", recordId: candidateId, schemaVersion: 1 };

// Write: authorize, encrypt OUTSIDE the transaction, then store.
const envelope = await encryptRecord(context, { email, phone }, { kms, environment: "dev", kekRef: orgKekRef });
const payload = serializeEnvelope(envelope); // bytea; or map the fields onto separate columns

// Read: authorize, fetch and commit, then decrypt with the context from the request (not from the row).
const result = await decryptRecord(context, parseEnvelope(payload), { kms, environment: "dev" });
if (result.kind === "json") {
  /* use result.value; return only the fields needed */
}
```

Blind index for exact-match search:

```ts
import { blindIndex, deriveIndexKey, normalizeEmail } from "@talentstroom/crypto";

const key = await deriveIndexKey(indexRootBytes, { organizationId, fieldCode: "email", indexVersion: 1 });
const digest = await blindIndex(key, normalizeEmail(input)); // candidate_blind_indexes.digest
```

KEK rotation or provider migration: `rewrapRecord(context, envelope, newKekRef, deps)` returns a new envelope with the same ciphertext and a freshly wrapped DEK.

## Rules for callers

- **Authorize first.** Check membership, permission and organization scope before you encrypt or decrypt. Build the `context` from trusted request state.
- **Never inside a DB transaction** (ADR 0007). KMS calls are network calls: fetch and commit first, then decrypt; encrypt first, then write.
- **Fail closed.** On `KmsUnavailableError`, return 503 or reject the write. Never fall back to plaintext.
- **`CryptoIntegrityError`** means tampering or the wrong context. Return a generic error and record a security event with ids only.
- **Never log, cache or queue plaintext.** That includes KV, Cache API, Durable Objects, queue payloads, traces and error reports. Decrypt per request and return only the fields that are needed.
- `normalizeEmail`/`normalizePhone` output is personal data too.
- The local KMS (`createLocalKms`) is for development and tests only. It refuses `production`. Use synthetic data with it.

## Threat model (summary)

| Threat                                                        | Protected?                                                                                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database-only breach (dump, backup, replica, Hyperdrive/Neon) | **Yes.** It yields ciphertext, wrapped DEKs and blind-index digests only. The KEKs and the index root stay in the KMS.                                              |
| Ciphertext moved between organizations/records/environments   | **Yes.** It fails AEAD authentication because of the AAD.                                                                                                           |
| Tampered ciphertext, nonce, tag, wrapped DEK or key version   | **Yes.** Detected (`CryptoIntegrityError`).                                                                                                                         |
| Compromised API Worker or leaked KMS credentials              | **No.** The attacker can call the legitimate decrypt path. Mitigations are KMS audit, alerting, rate limiting and revocation (ADR 0008).                            |
| Malicious authorized user / hijacked session                  | **No.** Covered by MFA, RBAC and telemetry instead.                                                                                                                 |
| Metadata (row counts, sizes, timing, equal blind indexes)     | **No.** Encryption hides contents, not metadata. Blind indexes reveal equality within one organization and field, and can be brute-forced if the derived key leaks. |
| Plaintext lingering in memory                                 | **Best effort.** Raw DEKs are zeroed after import, but JavaScript cannot guarantee zeroization.                                                                     |

## Plugging in a real KMS

Implement `KeyManagementService` in a new module (for example `src/kms/gcp.ts`) once the vendor is chosen (ADR 0008, PoC #42):

- `wrapKey(kekRef, rawKey, aad)` calls the provider's encrypt operation with `aad` as AAD or encryption context. It returns the wrapped bytes and the integer KEK version used. If the provider does not return a version, the adapter embeds it in the wrapped bytes and checks it again on unwrap.
- `unwrapKey(kekRef, wrappedKey, aad)` returns the raw key and the version that actually unwrapped it. The core rejects a mismatch with the envelope.
- Map timeouts, 5xx, 429 and auth failures to `KmsUnavailableError`. Map AAD or authentication failures to `CryptoIntegrityError`. Never put the response body, `kekRef`, AAD or key bytes in errors or logs.
- Use plain `fetch` and Web Crypto, with bounded retries and a per-isolate circuit breaker. Cache tokens in isolate memory only. Validate `kekRef` against the provider's resource-name pattern before building URLs.
- Run the existing tests against the adapter with a staging key and synthetic data.

## Development

```sh
pnpm --filter @talentstroom/crypto test
pnpm --filter @talentstroom/crypto typecheck
```
