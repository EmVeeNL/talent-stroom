# AGENTS.md

Guidance for AI coding agents (Claude, Codex, others) working in this repository.

## Product

TalentStroom: Dutch-first recruitment CRM for boutique agencies (2–10 recruiters). Multi-organization, candidate data encrypted per record, client shortlists via expiring links. Specs live in `docs/`. Read only what your task needs:

- Requirements: `docs/architecture/prd/03-functional-requirements.md`
- Architecture: `docs/architecture/architecture/`, decisions in `docs/adr/`
- Flows for a feature: `docs/flows/FLOW_INDEX.md`
- Database baseline: `docs/database/`

## Repository layout

```
apps/api       Hono API on Cloudflare Workers (wrangler)
apps/web       Vite + React recruiter app
apps/site      Astro public website (nl default, en)
packages/config     shared tsconfig
packages/contracts  Zod schemas shared by API and clients
packages/i18n       nl-NL (source) and en-GB catalogs
packages/ui         design tokens and UI components
```

## Commands

```sh
pnpm install            # pnpm via Corepack, Node 26
pnpm dev                # all dev servers (API :8787 via wrangler/workerd, web :5173, site :4321)
pnpm check              # oxfmt check + oxlint (type-aware) + typecheck + test (run before every PR)
pnpm format             # oxfmt
pnpm --filter @talentstroom/api cf-typegen   # after changing wrangler.jsonc
```

## Rules

1. **Do not change encryption, authentication, tenant scoping, CI/CD, or database migrations without an accepted ADR** in `docs/adr/`.
2. Every organization-owned read/write verifies membership and organization scope server-side. Never trust `X-Organization-Id` alone.
3. No personal data in logs, analytics, URLs, error messages, job payloads or shared caches. Use synthetic data in tests and fixtures.
4. Write the failing test (BDD scenario from the issue) first, then the minimal implementation.
5. Import workspace packages only via their public entry point; packages never import apps (enforced by oxlint).
6. User-facing strings go through `@talentstroom/i18n` keys; Dutch is the source language.
7. TypeScript 7 compiles and powers type-aware linting (oxlint + tsgolint). Only `apps/site` uses TypeScript 6, for `astro check` (`docs/adr/0003-typescript-7-toolchain.md`, `docs/adr/0009-oxlint-and-oxfmt.md`).
8. Dependencies: versions live in the `catalog` of `pnpm-workspace.yaml`; releases younger than 7 days are blocked (`docs/adr/0005-dependency-supply-chain-policy.md`).
9. Don't hand-write the Workers `Env` type; run `wrangler types`.
10. Keep the working set small (≈5–15 files per task). Report uncertainty and security implications in the PR.

## Parallel work with worktrees

One task = one worktree = one branch = one PR. Worktrees live outside the repo in `../talentstroom-worktrees/`.

```sh
scripts/worktree.sh new <slug> <branch>              # from origin/main, deps installed
scripts/worktree.sh codex <slug> <model> <prompt>    # run Codex inside the worktree
scripts/worktree.sh list                             # worktrees with PR state
scripts/worktree.sh clean                            # remove worktrees whose PR is merged/closed
```

Agents working in a worktree edit and test only; they do not commit, push or open PRs. The orchestrator reviews the diff, commits and opens the PR.

| Complexity                                                                               | Claude | Codex         |
| ---------------------------------------------------------------------------------------- | ------ | ------------- |
| Normal: well-specified implementation, config, docs, tests                               | Sonnet | `gpt-6-luna`  |
| Complex: security-critical design, crypto, tenancy, schema design, multi-package changes | Opus   | `gpt-6.1-sol` |

Balance each batch across both providers.

Prefer the cheaper model; escalate only when the result fails review. Security-sensitive diffs are always reviewed by the orchestrator regardless of model; record notable outcomes in `docs/architecture/engineering/model-evaluation-ledger.md`.

## Workflow

- Issues use the forms in `.github/ISSUE_TEMPLATE/`; backlog: https://github.com/users/EmVeeNL/projects/10
- Branch `feat/<issue>-<slug>`, `fix/…`, `chore/…`, `docs/…`, `sec/…`; PR into protected `main` (squash merge).
- Label AI-generated code in the PR description; a human reviews every PR.
