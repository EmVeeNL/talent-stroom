# Invites, organization switching, removal

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `06_invites_switching`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **invites, organization switching, removal** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Admin issues scoped invitation.
- **B** (decision): Validate role and seat entitlement.
- **C** (error): Reject unauthorized invitation.
- **D** (process): Email expiring one-time invitation.
- **E** (process): Recipient verifies identity and accepts.
- **F** (process): Create membership transactionally.
- **G** (decision): Switch active organization?.
- **H** (process): Clear tenant cache and rotate scoped token.
- **I** (end): Log membership changes.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Fail | C |
| B | Pass | D |
| D | Continue | E |
| E | Continue | F |
| F | Continue | G |
| G | Yes | H |
| G | No | I |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/06_invites_switching.mmd`
- Vector image: `../images/06_invites_switching.svg`
- High-resolution raster image: `../images/06_invites_switching.png`
