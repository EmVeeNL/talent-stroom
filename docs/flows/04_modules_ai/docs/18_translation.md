# Dutch-first translation request and review

**Product:** TalentStroom  
**Domain:** `04_modules_ai`  
**Flow ID:** `18_translation`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **dutch-first translation request and review** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): User requests translation.
- **B** (process): Choose source, target locale, content scope.
- **C** (decision): Check rights and redact confidential fields.
- **D** (error): Block or request restricted approval.
- **E** (process): Queue translation with glossary and locale.
- **F** (process): Review text and sensitive terminology.
- **G** (decision): Human approves publication?.
- **H** (end): Keep draft only.
- **I** (end): Store locale variant and source revision.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Fail | D |
| C | Pass | E |
| E | Continue | F |
| F | Continue | G |
| G | No | H |
| G | Yes | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/18_translation.mmd`
- Vector image: `../images/18_translation.svg`
- High-resolution raster image: `../images/18_translation.png`
