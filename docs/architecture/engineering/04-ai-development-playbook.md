# 15 — AI-assisted development with Claude and Codex

## Approach
Use provider/model **capability tiers**, not a fixed winner: models, availability, pricing and context limits change. Maintain a dated benchmark matrix per task and reevaluate monthly. No private repository content sent to unapproved providers; verify zero-retention/privacy terms and organization settings first.

| Task | Preferred tier | Provider candidates | Context strategy |
|---|---|---|---|
| PRD/ADR reasoning, architecture alternatives | Strong reasoning model | Claude or Codex/OpenAI | One ADR + relevant contracts, not whole repo |
| Bounded implementation in known module | Fast coding model | Codex or Claude | Ticket + affected files + typed API contract |
| Security-critical crypto/auth design | Strong reasoning + independent human expert | Two independent model reviews optional | Threat model + crypto spec; never trust generated cryptography alone |
| Test generation / Gherkin | Efficient coding model | Either | One feature + acceptance criteria |
| Large refactor / migration | Strong agent model + incremental commits | Either | Dependency graph and limited path allowlist |
| Docs / i18n consistency | Efficient writing/coding model | Either | Glossary + exact source strings |

## Token budgeting
- Split feature work into independent tickets that fit a **bounded working set** (e.g. 5–15 relevant files, not the entire monorepo).
- Every task begins with: desired behavior, acceptance criteria, API contract, relevant architecture decisions, affected paths, test commands, forbidden changes.
- Store stable guidance in `AGENTS.md` and `CLAUDE.md` with brief references to docs, never massive pasted PRDs.
- Summarize decisions into ADRs and issue comments between sessions; use fresh context per vertical slice.
- Use retrieval/file search and diff-based context; truncate logs; avoid generated lockfiles and build output in prompts.
- Escalate model capacity only when benchmarked quality or context need justifies cost; compare cost per accepted, tested change—not tokens alone.

## Example agent instructions
`Read README, engineering standards, the issue, and affected API contract. Write failing BDD tests first. Do not alter encryption, auth, tenant scoping, CI or migrations without an explicit ADR. Generate minimal patch. Run pnpm lint/typecheck/test. Report uncertainty and security implications.`

## Model evaluation ledger
Record evaluation date, provider, exact model ID, task type, context size, completion rate, human corrections, tests passed, token input/output, cost, latency and privacy posture. Update before each milestone; don't assert an unverified "best model".

## Human control
No AI direct production deployment, key access, security approval or bulk data access. Human engineers review every PR, especially authentication, SQL, KMS, privacy and third-party dependencies. Keep closed-source repo private and avoid leaking code through screenshots/prompts.
