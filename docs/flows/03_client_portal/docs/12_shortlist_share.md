# Client shortlist publication and link sharing

**Product:** TalentStroom  
**Domain:** `03_client_portal`  
**Flow ID:** `12_shortlist_share`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **client shortlist publication and link sharing** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Recruiter selects candidate applications.
- **B** (process): Preview and approve public fields and CVs.
- **C** (decision): Confirm sharing authority.
- **D** (error): Block publication.
- **E** (process): Snapshot approved profile content.
- **F** (process): Encrypt snapshot; issue random bearer token.
- **G** (process): Store token digest / expiry / grants.
- **H** (end): Copy link and notify client externally.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
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

- Editable Mermaid: `../mermaid/12_shortlist_share.mmd`
- Vector image: `../images/12_shortlist_share.svg`
- High-resolution raster image: `../images/12_shortlist_share.png`
