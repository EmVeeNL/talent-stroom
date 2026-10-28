# 0003 — TypeScript 7 toolchain with TypeScript 6 for API consumers

- **Status:** Accepted
- **Date:** 2026-10-28
- **Issue:** #27

## Context

The engineering standards require TypeScript 7 as the baseline. TypeScript 7.0 (the native compiler, July 2026) ships only an `unstable/*` JavaScript API. Tools that load TypeScript's API do not support it yet (verified 2026-10-28):

| Tool                     | Supported TypeScript                |
| ------------------------ | ----------------------------------- |
| `typescript-eslint` 8.72 | `>=4.8.4 <6.1.0`                    |
| `@astrojs/check` 0.9     | `^5 \|\| ^6`; refuses to run on 7.0 |

## Options considered

1. **Stay on TypeScript 6** everywhere — loses the TS7 speed and deviates from the standard.
2. **TypeScript 7 everywhere, drop type-aware linting and `astro check`** — loses important checks.
3. **TypeScript 7 for compiling/typechecking, TypeScript 6 only inside tools that need the API.**

## Decision

Option 3.

- The workspace `typescript` is **7.0.2**: `tsc -p .` in every TypeScript package uses the native compiler.
- `.pnpmfile.cjs` gives `typescript-eslint`, `@typescript-eslint/*`, `ts-api-utils`, `@astrojs/check`, `@astrojs/language-server` and Volar packages their own **TypeScript 6.0.3** as a direct dependency instead of a peer. (pnpm `overrides` do not affect peer resolution, so a hook is required.)
- `apps/site` only typechecks through `astro check`, so it uses the named catalog `catalog:typescript6`.
- Shared compiler options live in `@talentstroom/config` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and more).

## Consequences

- Two TypeScript versions in the lockfile. Type-aware lint rules evaluate with TS 6 semantics; differences between 6 and 7 are small but possible.
- When a tool supports TypeScript 7, remove its pattern from `.pnpmfile.cjs`. Astro offers experimental TS 7.1+ checking via `@astrojs/ts-content-mapper`, and `astro check` is planned for deprecation.

## Rollback

Delete `.pnpmfile.cjs` and set the catalog `typescript` to 6.0.3.
