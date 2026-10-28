# Interview, offer, placement and reversal

**Product:** TalentStroom  
**Domain:** `02_recruitment`  
**Flow ID:** `11_interview_offer_placement`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **interview, offer, placement and reversal** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Candidate enters interview stage.
- **B** (process): Schedule and create follow-up task.
- **C** (decision): Client decision or offer.
- **D** (end): Record rejection and outcome.
- **E** (process): Confirm offer details and acceptance.
- **F** (decision): Placement confirmed?.
- **G** (process): Return to active pipeline.
- **H** (process): Insert placement once, atomically.
- **I** (end): Record fee/currency and audit.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Rejected | D |
| C | Offer | E |
| E | Continue | F |
| F | No | G |
| G | Retry | B |
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

- Editable Mermaid: `../mermaid/11_interview_offer_placement.mmd`
- Vector image: `../images/11_interview_offer_placement.svg`
- High-resolution raster image: `../images/11_interview_offer_placement.png`
