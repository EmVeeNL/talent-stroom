# Candidate-to-vacancy and Kanban stages

**Product:** TalentStroom  
**Domain:** `02_recruitment`  
**Flow ID:** `10_application_pipeline`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **candidate-to-vacancy and kanban stages** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Select candidate and vacancy.
- **B** (decision): Validate same organization and permissions.
- **C** (error): Deny cross-tenant access.
- **D** (process): Upsert unique application.
- **E** (process): Move stage with optimistic version check.
- **F** (decision): Transition valid?.
- **G** (error): Revert UI and show conflict.
- **H** (process): Record immutable stage event.
- **I** (end): Emit task automation event.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | No | C |
| B | Yes | D |
| D | Continue | E |
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

- Editable Mermaid: `../mermaid/10_application_pipeline.mmd`
- Vector image: `../images/10_application_pipeline.svg`
- High-resolution raster image: `../images/10_application_pipeline.png`
