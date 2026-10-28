# Transactional outbox, workers, tasks and reminders

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `24_outbox_jobs_reminders`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **transactional outbox, workers, tasks and reminders** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Domain event occurs in transaction.
- **B** (process): Persist business row and outbox event.
- **C** (process): Dispatcher claims event with lease.
- **D** (decision): Consumer checks idempotency key.
- **E** (end): Mark previously completed and ack.
- **F** (process): Execute task / notification / AI work.
- **G** (decision): Succeeded?.
- **H** (error): Exponential retry then dead-letter + alert.
- **I** (end): Mark delivered and store receipt.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Already done | E |
| D | New | F |
| F | Continue | G |
| G | No | H |
| H | Retry | C |
| G | Yes | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/24_outbox_jobs_reminders.mmd`
- Vector image: `../images/24_outbox_jobs_reminders.svg`
- High-resolution raster image: `../images/24_outbox_jobs_reminders.png`
