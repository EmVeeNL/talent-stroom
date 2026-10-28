# 12 — Monorepo, TS7 and code standards

## Proposed structure
```
apps/
  api/             # Hono Worker
  web/             # Vite + React
  site/            # Astro public site and tutorials
  docs/            # developer portal and API reference
  worker-jobs/     # queue handlers
packages/
  contracts/       # OpenAPI, schemas, generated SDK
  database/        # migrations, repositories
  crypto/          # audited wrapper around envelope encryption
  auth/            # org policies, session rules
  ui/              # design tokens and accessible components
  i18n/            # nl-NL/en-GB catalogs
  config/          # TS, ESLint, formatting
  test-utils/      # BDD fixtures and helpers
infra/             # IaC and cloud bindings
.github/workflows/
docs/              # ADRs, standards, playbooks
```

## Tooling
pnpm workspace + Turborepo task graph; pinned Node/pnpm via Corepack; package lock committed; reproducible frozen installs in CI; changesets or equivalent release versioning. TypeScript **7 stable** as the baseline (released July 2026); pin exact version and test compatibility for Hono, Vite, Astro, code generators and Workers. Source: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/

## Compiler and quality
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, enforce no implicit any, intentional unsafe casts only with comment/test. ESLint flat config, Prettier, import boundaries, no cycles, secret scanning, dependency and license scanning. API contract changes trigger SDK regeneration and compatibility checks. No unsafe user input to SQL, HTML or commands; crypto always through centrally reviewed package.

## Architecture decision records
Write ADR per major choice (e.g. Hono, KMS, Postgres, AI provider, module schema, identity provider), with context, options, consequences and rollback. Require threat-model update for auth, storage, AI or public endpoints.

## Documentation standards
Version PRD, diagrams, OpenAPI, migration notes, runbooks, data dictionary, UX patterns, glossary, BDD scenarios, security policies and release notes in repo. Dutch product copy is reviewed by native users; code identifiers and developer docs use English.
