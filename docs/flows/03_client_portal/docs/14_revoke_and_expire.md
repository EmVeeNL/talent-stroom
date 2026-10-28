# Share link expiration, revocation, CV denial

**Product:** TalentStroom  
**Domain:** `03_client_portal`  
**Flow ID:** `14_revoke_and_expire`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **share link expiration, revocation, cv denial** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Portal request or recruiter revoke action.
- **B** (process): Check token state against primary DB.
- **C** (decision): Active and authorized?.
- **D** (end): Deny portal and document access.
- **E** (process): Resolve scoped shortlist only.
- **F** (process): Issue time-limited document access.
- **G** (end): Record access audit without raw token.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
| C | Yes | E |
| E | Continue | F |
| F | Continue | G |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/14_revoke_and_expire.mmd`
- Vector image: `../images/14_revoke_and_expire.svg`
- High-resolution raster image: `../images/14_revoke_and_expire.png`
