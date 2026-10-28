# AI assistant with authorized retrieval and approval

**Product:** TalentStroom  
**Domain:** `04_modules_ai`  
**Flow ID:** `17_ai_assistant`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **ai assistant with authorized retrieval and approval** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): User asks AI to assist.
- **B** (decision): Authorize organization and permitted records.
- **C** (error): Deny or minimize requested access.
- **D** (process): Retrieve minimum required plaintext in worker.
- **E** (process): Redact/minimize and enforce provider policy.
- **F** (process): Invoke model with structured outputs.
- **G** (decision): Validate hallucinations, safety and provenance.
- **H** (process): Show warning and request revision.
- **I** (process): User previews and approves changes.
- **J** (end): Write authorized changes with audit.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Denied | C |
| B | Allowed | D |
| D | Continue | E |
| E | Continue | F |
| F | Continue | G |
| G | Fail | H |
| H | Continue | I |
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

- Editable Mermaid: `../mermaid/17_ai_assistant.mmd`
- Vector image: `../images/17_ai_assistant.svg`
- High-resolution raster image: `../images/17_ai_assistant.png`
