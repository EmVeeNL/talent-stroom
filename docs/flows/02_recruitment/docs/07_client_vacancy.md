# Client contact and vacancy creation

**Product:** TalentStroom  
**Domain:** `02_recruitment`  
**Flow ID:** `07_client_vacancy`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **client contact and vacancy creation** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Recruiter creates client.
- **B** (process): Deduplicate within organization.
- **C** (process): Save client / contacts.
- **D** (process): Create vacancy with owner and consent fields.
- **E** (decision): Validate organization-consistent FKs.
- **F** (error): Return validation errors.
- **G** (process): Save vacancy + initial pipeline.
- **H** (end): Emit audit and activity event.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Continue | E |
| E | Invalid | F |
| E | Valid | G |
| G | Continue | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/07_client_vacancy.mmd`
- Vector image: `../images/07_client_vacancy.svg`
- High-resolution raster image: `../images/07_client_vacancy.png`
