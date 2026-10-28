# CV upload, extraction and human review

**Product:** TalentStroom  
**Domain:** `02_recruitment`  
**Flow ID:** `08_candidate_cv_import`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **cv upload, extraction and human review** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Recruiter uploads PDF or DOCX.
- **B** (decision): Validate size MIME signature and malware.
- **C** (error): Reject and quarantine.
- **D** (process): Encrypt and store CV in private R2.
- **E** (process): Enqueue extraction job.
- **F** (process): Extract and validate structured draft.
- **G** (decision): Parsing usable?.
- **H** (process): Manual-entry fallback.
- **I** (process): Review / correct / approve fields.
- **J** (process): Check duplicates and save encrypted PII.
- **K** (end): Index safe searchable tokens; audit.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Invalid | C |
| B | Valid | D |
| D | Continue | E |
| E | Continue | F |
| F | Continue | G |
| G | No | H |
| G | Yes | I |
| H | Continue | I |
| I | Continue | J |
| J | Continue | K |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/08_candidate_cv_import.mmd`
- Vector image: `../images/08_candidate_cv_import.svg`
- High-resolution raster image: `../images/08_candidate_cv_import.png`
