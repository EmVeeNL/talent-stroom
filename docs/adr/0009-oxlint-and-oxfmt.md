# 0009 — oxlint and oxfmt replace ESLint and Prettier

- **Status:** Accepted
- **Date:** 2026-10-29
- **Supersedes:** the linting part of [0003](0003-typescript-7-toolchain.md)
- **Issue:** #28

## Context

ADR 0003 kept TypeScript 6 next to TypeScript 7 because typescript-eslint only supports TypeScript `<6.1`. That required a `.pnpmfile.cjs` hook, and type-aware lint rules evaluated with TypeScript 6 semantics. The oxc project ships a linter whose type-aware rules run on `tsgolint`, built on the TypeScript 7 native compiler, and a Prettier-compatible formatter.

## Options considered

1. **Keep ESLint + Prettier** with the TypeScript 6 shim until typescript-eslint supports 7.
2. **oxlint + oxfmt**: native speed, type-aware rules on TypeScript 7, one fewer TypeScript version for linting.
3. **Biome**: fast, but no type-aware rules on TypeScript 7.

## Decision

Option 2.

- `oxlint` 1.89 with `oxlint-tsgolint` 7.0.2004; `pnpm lint` runs `oxlint --type-aware --deny-warnings`. Config: `.oxlintrc.json`.
  - Categories `correctness`, `suspicious` and `perf` are errors; plugins typescript, unicorn, oxc, import, vitest; react and jsx-a11y for `apps/web`.
  - Kept from the ESLint setup: `import/no-cycle`, no deep imports into workspace packages, packages must not import apps, `consistent-type-imports`, interfaces over type aliases, React hooks rules.
- `oxfmt` 0.74 replaces Prettier (`pnpm format`, `pnpm format:check`). Config `.oxfmtrc.json`, migrated with `oxfmt --migrate=prettier`; it also formats `.astro` files.
- `.pnpmfile.cjs` is removed. TypeScript 6 remains only in `apps/site` (`catalog:typescript6`) because `astro check` refuses TypeScript 7.0.

Verified with throwaway probe files: package boundary, deep import, import cycle and `no-floating-promises` (type-aware) violations are all reported.

## Consequences

- Lint and format run in well under a second on the current codebase.
- Type-aware rules use the same compiler as `tsc` (TypeScript 7).
- oxlint covers most but not all ESLint and typescript-eslint rules. Missing rules can be added via oxlint's JS plugin support if needed.
- `unrs-resolver` (an ESLint import-plugin dependency) is removed from `allowBuilds` in `pnpm-workspace.yaml`.
- Editors need the oxc extension instead of the ESLint/Prettier extensions.

## Rollback

Restore `eslint.config.js`, `.prettierrc.json`, `.prettierignore` and `.pnpmfile.cjs` from git history and the corresponding catalog entries.
