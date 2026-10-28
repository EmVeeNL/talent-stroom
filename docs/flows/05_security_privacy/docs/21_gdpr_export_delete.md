# GDPR access/export, erasure and retention

**Product:** TalentStroom  
**Domain:** `05_security_privacy`  
**Flow ID:** `21_gdpr_export_delete`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **gdpr access/export, erasure and retention** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Controller opens data request.
- **B** (decision): Verify identity, scope, legal hold.
- **C** (error): Escalate / reject unverified request.
- **D** (process): Locate records, versions, files and shares.
- **E** (decision): Export request?.
- **F** (end): Create encrypted portable export and expire link.
- **G** (process): Revoke access tokens and portal shares.
- **H** (process): Delete/cryptoshred live PII and documents.
- **I** (process): Queue downstream deletion and backup tombstone.
- **J** (end): Record privacy audit and completion evidence.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Fail | C |
| B | Pass | D |
| D | Continue | E |
| E | Yes | F |
| E | Erasure | G |
| G | Continue | H |
| H | Continue | I |
| I | Continue | J |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/21_gdpr_export_delete.mmd`
- Vector image: `../images/21_gdpr_export_delete.svg`
- High-resolution raster image: `../images/21_gdpr_export_delete.png`
