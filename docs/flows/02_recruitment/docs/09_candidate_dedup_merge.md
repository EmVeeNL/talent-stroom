# Candidate deduplication and controlled merge

**Product:** TalentStroom  
**Domain:** `02_recruitment`  
**Flow ID:** `09_candidate_dedup_merge`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **candidate deduplication and controlled merge** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Search or create candidate.
- **B** (process): Compare tenant-scoped blind indexes.
- **C** (decision): Likely duplicate?.
- **D** (end): Save as new candidate.
- **E** (process): Show privileged comparison.
- **F** (decision): User confirms merge?.
- **G** (end): Keep distinct records.
- **H** (process): Move verified references transactionally.
- **I** (end): Retain merge audit and privacy lineage.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
| C | Yes | E |
| E | Continue | F |
| F | No | G |
| F | Yes | H |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/09_candidate_dedup_merge.mmd`
- Vector image: `../images/09_candidate_dedup_merge.svg`
- High-resolution raster image: `../images/09_candidate_dedup_merge.png`
