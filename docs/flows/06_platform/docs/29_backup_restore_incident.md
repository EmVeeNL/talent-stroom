# Backup, PITR recovery and incident operations

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `29_backup_restore_incident`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **backup, pitr recovery and incident operations** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Scheduled backup or incident alert.
- **B** (process): Verify Neon restore point and R2 object backups.
- **C** (decision): Incident declared?.
- **D** (process): Run periodic isolated restore drill.
- **E** (process): Contain infrastructure and preserve evidence.
- **F** (process): Restore to isolated branch and validate integrity.
- **G** (process): Replay deletion tombstones / check KMS access.
- **H** (process): Approve cutover with auditable change control.
- **I** (end): Verify RPO/RTO and publish postmortem.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | No | D |
| D | Continue | I |
| C | Yes | E |
| E | Continue | F |
| F | Continue | G |
| G | Continue | H |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/29_backup_restore_incident.mmd`
- Vector image: `../images/29_backup_restore_incident.svg`
- High-resolution raster image: `../images/29_backup_restore_incident.png`
