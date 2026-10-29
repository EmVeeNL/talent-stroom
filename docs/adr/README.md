# Architecture Decision Records

One file per significant decision: `NNNN-short-title.md`, numbered sequentially. Copy [`0000-template.md`](0000-template.md).

- An ADR is **required** before changing encryption, authentication, tenant scoping, CI/CD or database migrations (see `AGENTS.md`).
- ADRs are immutable once accepted. To change a decision, write a new ADR and mark the old one `Superseded by NNNN`.
- Open questions still to be decided live in [`../architecture/decisions/01-open-decisions.md`](../architecture/decisions/01-open-decisions.md) (D01–D15). Reference the D-number when an ADR resolves one.

| ADR                                            | Title                                                      | Status                                    |
| ---------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| [0001](0001-record-architecture-decisions.md)  | Record architecture decisions                              | Accepted                                  |
| [0002](0002-frontend-stack.md)                 | Frontend stack: Vite + React app, Astro public site        | Accepted                                  |
| [0003](0003-typescript-7-toolchain.md)         | TypeScript 7 toolchain with TypeScript 6 for API consumers | Accepted, linting part superseded by 0009 |
| [0004](0004-local-dev-and-hosting.md)          | Local development with Wrangler and hosting on workers.dev | Accepted                                  |
| [0005](0005-dependency-supply-chain-policy.md) | Dependency supply-chain policy                             | Accepted                                  |
| [0006](0006-identity-better-auth.md)           | Identity with Better Auth                                  | Accepted                                  |
| [0007](0007-database-neon-hyperdrive.md)       | Database: Neon Postgres via Cloudflare Hyperdrive          | Accepted, amended by 0006 (auth binding)  |
| [0008](0008-key-management-kms.md)             | Key management: external KMS for envelope encryption       | Proposed                                  |
| [0009](0009-oxlint-and-oxfmt.md)               | oxlint and oxfmt replace ESLint and Prettier               | Accepted                                  |
| [0010](0010-migration-runner.md)               | Migration runner: own runner on `pg`                       | Accepted                                  |
| [0011](0011-envelope-encryption-format.md)     | Envelope encryption format                                 | Accepted                                  |
