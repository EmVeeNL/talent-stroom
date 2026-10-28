# Custom module record edit and permissions

**Product:** TalentStroom  
**Domain:** `04_modules_ai`  
**Flow ID:** `16_custom_record_access`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **custom module record edit and permissions** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): User opens custom module.
- **B** (decision): Check membership, module grant, version.
- **C** (error): Deny and audit.
- **D** (process): Render whitelisted field widgets.
- **E** (process): Validate typed values and data classification.
- **F** (decision): Sensitive field?.
- **G** (process): Encrypt value and maintain permitted index.
- **H** (process): Write tenant-scoped record with version.
- **I** (end): Audit modification.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Fail | C |
| B | Pass | D |
| D | Continue | E |
| E | Continue | F |
| F | Yes | G |
| F | No | H |
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

- Editable Mermaid: `../mermaid/16_custom_record_access.mmd`
- Vector image: `../images/16_custom_record_access.svg`
- High-resolution raster image: `../images/16_custom_record_access.png`
