# Signup and first workspace

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `01_signup_workspace`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **signup and first workspace** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Visitor registers.
- **B** (process): Verify email or provider identity.
- **C** (decision): Account verified?.
- **D** (error): Retry verification / revoke expired invite.
- **E** (process): Create personal identity.
- **F** (process): Create organization and membership OWNER.
- **G** (process): Initialize settings and audit event.
- **H** (end): Select organization and enter app.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
| D | Retry | B |
| C | Yes | E |
| E | Continue | F |
| F | Continue | G |
| G | Continue | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/01_signup_workspace.mmd`
- Vector image: `../images/01_signup_workspace.svg`
- High-resolution raster image: `../images/01_signup_workspace.png`
