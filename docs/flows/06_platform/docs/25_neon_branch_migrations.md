# Database migrations, CI/CD and Neon branching

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `25_neon_branch_migrations`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **database migrations, ci/cd and neon branching** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): PR with migration and BDD scenarios.
- **B** (process): CI creates isolated Neon branch.
- **C** (process): Run migrations, constraints and seed fixtures.
- **D** (decision): Run unit, integration, RLS and security tests.
- **E** (error): Block PR; repair migration.
- **F** (process): Review backward-compatible rollout.
- **G** (process): Deploy Cloudflare Worker behind flags.
- **H** (process): Apply production migration via controlled job.
- **I** (end): Smoke test / monitor / rollback application.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Failed | E |
| D | Passed | F |
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

- Editable Mermaid: `../mermaid/25_neon_branch_migrations.mmd`
- Vector image: `../images/25_neon_branch_migrations.svg`
- High-resolution raster image: `../images/25_neon_branch_migrations.png`
