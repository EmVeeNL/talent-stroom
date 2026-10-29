# 0011 — Envelope encryption format, AAD encoding and blind-index derivation

- **Status:** Accepted (approved by merging PR)
- **Date:** 2026-10-29
- **Resolves:** the "AAD canonical encoding" and "fake KMS" follow-ups of [0008](0008-key-management-kms.md); refines its AAD string (see Decision 3)
- **Issue:** #74 (also informs #75, #76)

## Context

Candidate PII is envelope-encrypted per record in the application before it reaches Neon (spec `docs/architecture/security/01-encryption-key-management.md`, flows 19 and 20). ADR 0008 (Proposed) fixes the shape: a provider-neutral KMS interface, per-organization KEKs, an AAD that binds tenant and record, a KMS-wrapped blind-index root with HKDF subkeys, fail closed, and a local fake KMS for development and tests. The KMS vendor is not chosen yet (decided before PoC #42).

`packages/crypto` (`@talentstroom/crypto`) implements this. It must run on Cloudflare Workers and Node 26 with Web Crypto only (no third-party crypto, ADR 0005), never call the KMS inside a database transaction (ADR 0007), and produce bytes that fit `encryption_key_envelopes` / `candidate_private` (`docs/database/sql/03_data_protection.sql`). Stored formats are hard to change later, so the exact byte layouts are fixed here.

## Options considered

1. **AEAD:** AES-256-GCM (chosen; Web Crypto on Workers and Node, 96-bit nonce, 128-bit tag) vs XChaCha20-Poly1305 (misuse-resistant nonce size but not in Web Crypto; needs a library) vs AES-GCM-SIV (not in Web Crypto).
2. **AAD encoding:** `|`-joined string as sketched in ADR 0008 (ambiguous if a field ever contains `|`) vs JSON (no canonical form) vs **length-prefixed fields** (chosen; injective by construction, trivial to reimplement).
3. **Key version in the record AAD** (as the ADR 0008 string suggests) vs **only in KMS-side binding** (chosen; see Decision 3).
4. **Envelope storage:** separate columns only vs **one versioned binary blob plus an equivalent object** (chosen; the object maps onto the existing columns, the blob suits a single `bytea`).

## Decision

### 1. Algorithms

| Purpose             | Algorithm                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Record encryption   | AES-256-GCM, fresh random 256-bit DEK per `encryptRecord` call, fresh random 96-bit nonce, 128-bit tag. A DEK encrypts exactly one message. |
| DEK wrapping        | The KMS's AEAD with our AAD (provider AAD / encryption context). The fake KMS uses AES-256-GCM.                                             |
| Blind-index subkeys | HKDF-SHA-256 from a 256-bit per-environment root → non-extractable HMAC-SHA-256 key.                                                        |
| Blind index         | HMAC-SHA-256 over the normalized UTF-8 value, full 32-byte output.                                                                          |
| Randomness          | `crypto.getRandomValues` only.                                                                                                              |

DEKs are imported as non-extractable `CryptoKey`s and the raw buffers are zeroed right after import or wrapping (best effort: JS cannot guarantee that no other copy exists, for example inside a KMS adapter's HTTP stack). Because every DEK is used once, random nonces have no collision risk under one key; nonce reuse is impossible through the public API, which has no "encrypt again with the same DEK" path.

### 2. AAD byte encoding

`fields(f1, ..., fn)` = for each field: `u16be(byteLength(utf8(f)))` followed by `utf8(f)`. The number of fields is fixed per label, so the encoding is injective. Integers are written as decimal strings without leading zeros. UUIDs are validated and lowercased first; record types and field codes match `[a-z][a-z0-9_]{0,63}`; environments match `[a-z][a-z0-9-]{0,31}`; KEK references match `[A-Za-z0-9][A-Za-z0-9._:/@+=-]{0,255}`. No field contains personal data.

| Use                                           | Fields                                                                                                                              |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Record AEAD (`encryptRecord`/`decryptRecord`) | `"ts:v1"`, `"record"`, environment, organizationId, recordType, recordId, schemaVersion, formatVersion (`"1"`), algorithmId (`"1"`) |
| DEK wrap/unwrap (sent to the KMS)             | `"ts:v1"`, `"dek"`, environment, organizationId, recordType, recordId, schemaVersion, kekRef                                        |
| Blind-index HKDF `info`                       | `"ts:v1"`, `"bidx"`, organizationId, fieldCode, indexVersion                                                                        |
| Fake KMS internal AAD                         | `fields("ts:v1", "local-kms-wrap", kekRef, keyVersion)` followed by the caller's AAD                                                |

The second field is a domain label, so an AAD of one use can never equal an AAD of another.

### 3. Where the key version is bound (refinement of ADR 0008)

ADR 0008 sketches the wrap AAD as `ts:v1|env|org_id|subject_type|subject_id|wrapping_version`. We do **not** put the KEK version in any AAD that we compute:

- In the **record** AAD it would force re-encrypting the record on every KEK rotation, defeating rewrap.
- In the **DEK-wrap** AAD it cannot be known before the wrap: a provider-neutral KMS picks the primary version when it encrypts (AWS does not expose versions at all; GCP reports the version used only in the response).

Instead the KMS binds the version cryptographically (it is part of the provider ciphertext; in the fake KMS it is in the authenticated header), `unwrapKey` must report the version that actually unwrapped, and `decryptRecord` fails with `CryptoIntegrityError` if that differs from the envelope's `keyVersion`. Tampering with the stored version is therefore detected; there is no downgrade path because a wrapped DEK only ever opens under the version that wrapped it.

The context (environment, organization, record type, record id, schema version) is **not stored in the envelope**. The caller supplies it on decrypt from trusted request state (authenticated organization, requested record id), so an envelope copied to another row, organization, record type, schema version or environment fails authentication.

### 4. Envelope

Object form (`EncryptedEnvelope`): `formatVersion` (1), `algorithm` (`"AES-256-GCM"`), `kekRef`, `keyVersion`, `wrappedDek`, `nonce`, `ciphertext` (includes the tag). Column mapping: `kms_key_ref`, `wrapping_version`, `wrapped_dek`, `cipher`, `nonce`, `encrypted_payload`.

Binary form v1 (`serializeEnvelope` / `parseEnvelope`), big-endian:

```
u8   formatVersion      = 0x01
u8   algorithmId        = 0x01   AES-256-GCM, 96-bit nonce, 128-bit tag
u32  keyVersion                  1..2^32-1
u16  kekRefLength                1..256
     kekRef                      ASCII subset (see Decision 2)
u16  wrappedDekLength            1..1024
     wrappedDek
12   nonce
u32  ciphertextLength            17..2^20+17
     ciphertext || tag
```

Parsing is strict: unknown format version or algorithm id, any length outside its range, truncation, invalid kekRef, or **any trailing byte** is rejected with `EnvelopeFormatError`. Parsing authenticates nothing; only decryption does.

The plaintext inside the ciphertext starts with one kind byte (`0x00` raw bytes, `0x01` UTF-8 JSON), so the kind is confidential and authenticated. Maximum plaintext is 1 MiB; documents and other large blobs need their own (streaming/chunked) format and ADR.

### 5. Versioning and migration

- **Format or algorithm change:** new `formatVersion` (and/or `algorithmId`). Readers support all versions still present in data; writers produce only the newest. A background job decrypts and re-encrypts old envelopes (new DEK), then old-version support is removed in a later release once a coverage query shows zero rows.
- **KEK rotation / provider migration:** `rewrapRecord` unwraps the DEK and wraps it under the new primary version or new `kekRef`; ciphertext and nonce are untouched and the record plaintext is never seen. Disable the old KEK version only after coverage is complete.
- **Suspected DEK or KEK compromise:** rewrapping is not enough; re-encrypt with new DEKs (spec 01).
- **Payload schema change:** bump `schemaVersion`; because it is in the AAD, a record re-encrypted under a new schema cannot be confused with the old one.
- **Blind-index rotation:** bump `indexVersion`, dual-read old and new digests, reindex, then drop the old version.

### 6. Blind indexes

`deriveIndexKey(root, { organizationId, fieldCode, indexVersion })` = HKDF-SHA-256 with an empty salt (RFC 5869 then uses a zero block; the root is uniformly random) and the `info` above, giving a non-extractable, sign-only HMAC-SHA-256 key. The root is one random 256-bit key per environment, stored wrapped by the KMS and unwrapped per isolate (ADR 0008 option "cached root"). Values are normalized first:

- **Email:** trim, Unicode NFC, locale-independent lowercase, minimal shape check. No provider-specific rules (Gmail dots, `+tag`), no IDNA conversion.
- **Phone:** E.164 without libphonenumber. Dutch `06…`, `0…` (9 national digits), `0031…`, `+31…`, `+31 (0)…` and `+31 06…` become `+31` + 9 digits. Other countries are accepted only with `+` or `00` and 8–15 digits, taken as given. Everything else, including ambiguous numbers without a prefix and Dutch numbers of other lengths (some 0800/0900 and 097 numbers), is rejected.

### 7. Fake KMS restrictions

`createLocalKms` is for development and tests only:

- Refuses `environment` `production`/`prod` (any case, trimmed).
- KEKs live in process memory: random per instance, or derived via HKDF from an explicit dev secret (≥ 32 bytes) so dev data survives restarts. Dev secrets are synthetic and never committed in a form that looks like a real key.
- No access control, audit, HSM or rate limiting. Never bound in a Worker that can reach production or staging data.
- Supports rotation, disabling a version and simulated outages for tests.

### 8. Errors and hygiene

`KmsUnavailableError` (fail closed, 503), `CryptoIntegrityError` (tampering or wrong context; `EnvelopeFormatError` is a subtype), `CryptoInputError`, `NormalizationError`, `ForbiddenEnvironmentError`, all under `CryptoError` with static messages and a `code`. Messages never include plaintext, keys, ciphertext, key references or ids, and no provider error is chained as `cause`. Unknown adapter errors map to `KmsUnavailableError`. The package does not log; `no-console` is enforced by oxlint for `packages/crypto`.

## Consequences

- **Easier:** one small dependency-free module; a real KMS adapter only implements `wrapKey`/`unwrapKey`; envelopes are self-describing and versioned; swapping envelopes across tenants, records, schema versions or environments is detected.
- **Harder:** every decrypt needs the context from the caller, so call sites must pass trusted ids. Each record costs one KMS call per read and write. The binary layout is now a compatibility contract.
- **Security:** protects against a database-only breach. It does not protect against a compromised runtime or KMS credentials (spec 01, ADR 0008), nor hide sizes, counts, timing or blind-index equality. JavaScript cannot guarantee zeroization.
- **Privacy:** AAD and key references contain only UUIDs, type codes and versions; no personal data reaches the KMS or its logs.
- **Cost:** none beyond the KMS operations in ADR 0008.

## Rollback

No production data exists yet. Before go-live the format can change freely. After go-live, a change means a new `formatVersion` plus a re-encryption job (Decision 5); data in v1 stays readable as long as the v1 reader is kept. Reverting to a design without application-layer encryption would violate spec 01 and needs a new ADR.
