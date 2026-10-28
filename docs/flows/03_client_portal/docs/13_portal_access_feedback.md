# Anonymous client review and feedback

**Product:** TalentStroom  
**Domain:** `03_client_portal`  
**Flow ID:** `13_portal_access_feedback`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **anonymous client review and feedback** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Client opens shortlist link.
- **B** (decision): Hash token; validate expiry revocation scope.
- **C** (error): Return generic unavailable response.
- **D** (process): Rate-limit; retrieve approved snapshot.
- **E** (process): View authorized CV through short-lived access.
- **F** (process): Submit rating / decision / comment.
- **G** (decision): Validate CSRF / abuse / scope / payload.
- **H** (error): Reject with safe response.
- **I** (process): Store feedback, idempotency and event.
- **J** (end): Notify owning recruiter.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Invalid | C |
| B | Valid | D |
| D | Continue | E |
| E | Continue | F |
| F | Continue | G |
| G | Fail | H |
| G | Pass | I |
| I | Continue | J |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/13_portal_access_feedback.mmd`
- Vector image: `../images/13_portal_access_feedback.svg`
- High-resolution raster image: `../images/13_portal_access_feedback.png`
