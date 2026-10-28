# KMS key rotation and database exposure

**Product:** TalentStroom  
**Domain:** `05_security_privacy`  
**Flow ID:** `22_key_rotation_breach`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **kms key rotation and database exposure** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Scheduled rotation or security incident.
- **B** (decision): Classify KMS vs database vs runtime exposure.
- **C** (process): DB-only: revoke credentials, investigate.
- **D** (process): Runtime/KMS: contain sessions and key grants.
- **E** (process): Rotate KEK and rewrap record DEKs.
- **F** (decision): Verify integrity and exhaustive coverage.
- **G** (process): Retry failed records; preserve old version safely.
- **H** (end): Finalize rotation, audit and incident response.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | DB only | C |
| B | Runtime/KMS | D |
| C | Continue | E |
| D | Continue | E |
| E | Continue | F |
| F | Incomplete | G |
| G | Retry | F |
| F | Complete | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/22_key_rotation_breach.mmd`
- Vector image: `../images/22_key_rotation_breach.svg`
- High-resolution raster image: `../images/22_key_rotation_breach.png`
