# Session expiry, inactivity lock, step-up

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `05_session_autolock`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **session expiry, inactivity lock, step-up** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Authenticated session active.
- **B** (process): Track meaningful user activity.
- **C** (decision): Idle threshold exceeded?.
- **D** (process): Continue with sliding session limits.
- **E** (process): Lock sensitive workspace UI.
- **F** (decision): Require passkey / MFA unlock.
- **G** (error): Expire and clear organization caches.
- **H** (end): Restore scoped session.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
| D | Continue | B |
| C | Yes | E |
| E | Continue | F |
| F | Denied or timed out | G |
| F | Successful | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/05_session_autolock.mmd`
- Vector image: `../images/05_session_autolock.svg`
- High-resolution raster image: `../images/05_session_autolock.png`
