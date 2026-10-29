# 0005 — Dependency supply-chain policy

- **Status:** Accepted
- **Date:** 2026-10-28
- **Issue:** #26, #34

## Context

The product stores candidate personal data. A compromised npm release is a realistic attack path; malicious versions are usually detected and unpublished within days.

## Decision

In `pnpm-workspace.yaml`:

- **`minimumReleaseAge: 10080`** — pnpm only installs versions published at least 7 days ago. Do not add `minimumReleaseAgeExclude` entries without review; when a fresh release is urgently needed (security fix), document why in the PR.
- **`allowBuilds`** — only listed packages may run install scripts (`esbuild`, `sharp`, `unrs-resolver`, `workerd`).
- **Catalog** — all shared versions are pinned exactly in one place; packages use `catalog:`.
- Lockfile is committed; CI installs with `--frozen-lockfile`.

## Consequences

- Newest releases arrive with a one-week delay. The Workers compatibility date is limited to what the pinned workerd supports.
- Adding a dependency with install scripts needs an explicit entry and review.

## Rollback

Remove `minimumReleaseAge` from `pnpm-workspace.yaml`.
