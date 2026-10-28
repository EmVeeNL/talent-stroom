# 09 — Encryption and key management (security-critical)

## Threat model: what encryption can and cannot do
**Database-only exfiltration:** per-record envelope encryption makes sensitive contents unreadable without external keys (assuming secure implementation). **Database + KMS credentials / compromised API worker:** an attacker may invoke legitimate decrypt paths; encryption alone cannot protect. **Malicious org member / session hijack:** legitimate application access may expose authorized plaintext; prevent with MFA, RBAC, abuse controls and telemetry. **Deletion ransomware:** encryption doesn't replace immutable backups and restoration.

## Correct terminology
A **hash** is one-way, useful for password hashing or blind indexes; it is **not** a reversible encryption key. Never use `hash(record_id + master_password)` as the sole record secret. Generate each **data encryption key (DEK)** with a CSPRNG, and protect it using a **key-encryption key (KEK)** held outside the database.

## Recommended envelope encryption
1. Generate 256-bit random DEK per sensitive record (and preferably independent per file/blob).
2. Encrypt canonical serialized sensitive fields with audited **AES-256-GCM** (or vetted misuse-resistant approved AEAD); generate fresh unique nonce per encryption under that DEK.
3. Authenticate associated data: organization ID, record ID, record type, field grouping, ciphertext schema version.
4. Wrap DEK with KMS-managed KEK; database stores ciphertext, wrapped DEK, algorithm, key version, nonce/tag and metadata, but **never KEK/plaintext DEK**.
5. On authorized read: authenticate session/org/permission; fetch encrypted object; request KMS unwrap with narrowly privileged workload identity; decrypt inside trusted service; return minimal necessary fields.
6. Zero or minimize plaintext lifetime and plaintext logging; avoid spilling to caches, job payloads, exceptions, tracing, analytics and dumps.
7. Encrypt document files before private blob storage; bind file identity into AEAD associated data.

## Keys and rotation
- KEK lives in managed HSM/KMS (separate trust boundary, audited access); use least-privilege unwrapping credentials, per-environment keys and rotation policies.
- DEKs are unique per record. KEK rotation can usually **rewrap** stored DEKs without re-encrypting record data; a DEK/algorithm compromise requires decrypt-and-reencrypt, with versioned migration.
- A compromised KEK may require reencrypting all affected data under new DEKs; mere rewrapping is not sufficient after plaintext DEKs may have been exposed.
- For organization-level crypto isolation, use org-specific KEKs or a documented derivation hierarchy backed by KMS; evaluate cost, revocation and blast radius.
- Maintain key inventory, custody, cryptographic agility, secure recovery, access alerting, break-glass policy and destruction tests.
- No raw key exports into developer laptops, CI logs, source code or database backups.

## Search and metadata leakage
Encryption does not hide record counts, sizes, creation times, relationships or access patterns. Blind index via keyed HMAC on normalized email/phone supports exact lookup, not general fuzzy matching; rotate index keys with dual-read/reindex rollout. Do not use ordinary unsalted SHA-256 for emails/phone due to dictionary attacks. Consider whether names, city, skills and notes truly need indexing; document any plaintext fields.

## Additional controls beyond encryption
- Restrict database network paths and credentials; use short-lived database credentials where possible.
- Apply application authorization, multi-tenant row safeguards and audited privileged access.
- Mask sensitive views; require step-up auth for exports and bulk decrypt.
- Throttle decryption and bulk requests; monitor anomalous access.
- Protect client-side data from XSS; strong CSP and no unsafe HTML.
- Backups are encrypted, protected by separate access policy, tested and deletion-aware.
- Per-tenant export/deletion must include replicas, queues, derived data, temporary files and index states as feasible.

## Validation plan
Perform cryptographic architecture review before implementation, test tampering/AAD mismatch, nonce uniqueness, key version changes, org swap, KMS outage, compromised DB restore, replay and concurrency. Run a tabletop exercise: attacker has *full DB dump but no KMS*; verify sensitive fields cannot be recovered. Then model app/KMS compromise and controls for that larger threat.

## Open architectural decision
Record-level AEAD prevents simple server-side full-text candidate search. Before committing to UX latency and search promise, select explicitly reviewed data-search trade-off; never weaken encryption silently for convenience.
