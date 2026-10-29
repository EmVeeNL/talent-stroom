# 0001 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-28
- **Issue:** #17

## Context

TalentStroom handles sensitive candidate data and makes security-critical choices (encryption, KMS, tenancy, identity). Those choices must be traceable for reviewers, auditors and AI coding agents working with limited context.

## Options considered

1. **No formal records** — fast, but decisions get lost and re-litigated.
2. **Wiki pages** — outside the repo, drift from code.
3. **ADRs in the repository** — versioned with the code, reviewable in PRs.

## Decision

Keep ADRs in `docs/adr/` using the template in `0000-template.md`, as recommended in `docs/architecture/engineering/01-monorepo-standards.md`.

## Consequences

Every major choice gets a short, reviewable document. Agents read the relevant ADR instead of whole PRDs. Changes to encryption, auth, tenant scoping, CI or migrations require an ADR.

## Rollback

None needed; ADRs can be abandoned at any time without code impact.
