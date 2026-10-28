# Admin-defined recruitment module lifecycle

**Product:** TalentStroom  
**Domain:** `04_modules_ai`  
**Flow ID:** `15_custom_module_builder`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **admin-defined recruitment module lifecycle** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Admin creates draft module.
- **B** (process): Define fields validations layouts role visibility.
- **C** (decision): Validate quotas schema and reserved names.
- **D** (error): Return actionable errors.
- **E** (process): Preview with synthetic data.
- **F** (process): Publish immutable version transactionally.
- **G** (decision): Migrate values with compatibility check.
- **H** (error): Block breaking publish; keep previous version.
- **I** (end): Activate version and audit change.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Invalid | D |
| C | Valid | E |
| E | Continue | F |
| F | Continue | G |
| G | Unsafe | H |
| G | Compatible | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/15_custom_module_builder.mmd`
- Vector image: `../images/15_custom_module_builder.svg`
- High-resolution raster image: `../images/15_custom_module_builder.png`
