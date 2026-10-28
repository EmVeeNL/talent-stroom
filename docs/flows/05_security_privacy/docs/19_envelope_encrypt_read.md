# Record-level envelope encryption and decrypt

**Product:** TalentStroom  
**Domain:** `05_security_privacy`  
**Flow ID:** `19_envelope_encrypt_read`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **record-level envelope encryption and decrypt** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Authorized write or read request.
- **B** (decision): Verify identity membership purpose and scope.
- **C** (error): Deny and record security event.
- **D** (process): Write: random DEK + AEAD nonce.
- **E** (process): Encrypt record with bound AAD (tenant/id/version).
- **F** (end): Wrap DEK via external KMS; store ciphertext.
- **G** (process): Read: fetch ciphertext + wrapped DEK.
- **H** (process): Unwrap using scoped KMS grant and decrypt.
- **I** (end): Check AEAD integrity and return minimum fields.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Denied | C |
| B | Write | D |
| D | Continue | E |
| E | Continue | F |
| B | Read | G |
| G | Continue | H |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/19_envelope_encrypt_read.mmd`
- Vector image: `../images/19_envelope_encrypt_read.svg`
- High-resolution raster image: `../images/19_envelope_encrypt_read.png`
