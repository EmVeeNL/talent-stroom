# Search encrypted candidate PII safely

**Product:** TalentStroom  
**Domain:** `05_security_privacy`  
**Flow ID:** `20_encrypted_search`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **search encrypted candidate pii safely** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Recruiter searches within organization.
- **B** (process): Authorize query and allowed search fields.
- **C** (process): Normalize exact-match search input.
- **D** (process): Compute keyed blind index outside Neon.
- **E** (process): Query organization-scoped blind index.
- **F** (process): Fetch candidate ciphertext with row limits.
- **G** (process): Decrypt authorized match set; verify match.
- **H** (end): Return minimal results and log metrics.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Continue | E |
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

- Editable Mermaid: `../mermaid/20_encrypted_search.mmd`
- Vector image: `../images/20_encrypted_search.svg`
- High-resolution raster image: `../images/20_encrypted_search.png`
