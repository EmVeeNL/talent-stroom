# Model evaluation ledger

Record measured results before each milestone (see `04-ai-development-playbook.md`). Don't assert an unverified "best model".

| Date | Provider | Exact model ID | Task type | Context size | Completed? | Human corrections | Tests passed | Tokens in/out | Cost | Latency | Privacy posture | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-29 | Anthropic | claude-opus (subagent) | ADR spike: Better Auth (#19) | ~15 docs + web | yes | binding/role reconciled with ADR 0007 | n/a | ~163k total | — | ~11 min | private repo context only | Strong sourcing; overlapped with parallel DB ADR |
| 2026-10-29 | Anthropic | claude-sonnet (subagent) | ADR spike: Neon + Hyperdrive (#20) | ~12 docs + web | yes | none | n/a | ~94k total | — | ~5 min | same | Quality on par with Opus spikes at ~half the tokens |
| 2026-10-29 | Anthropic | claude-opus (subagent) | ADR spike: KMS (#73) | ~10 docs + web | yes | none | n/a | ~203k total | — | ~11 min | same | Thorough; most expensive spike |
| 2026-10-29 | Anthropic | claude-opus (subagent) | DB foundation: runner, roles (#53/#54) | ~25 files | yes | ADR status, predev step | 34 db tests | ~167k total | — | ~13 min | same | High quality, verified locally incl. Neon simulation |
| 2026-10-29 | OpenAI | gpt-6.1-sol | API contracts + problems (#44/#45) | ~15 files | yes | none | all | — | — | — | Codex sandbox | Good; conservative validation errors |
| 2026-10-29 | OpenAI | gpt-6.1-sol | Cursor pagination + ETag (#47) | ~6 files | yes | none | 75 tests | — | — | — | Codex sandbox | Careful crypto usage (constant-time verify) |
| 2026-10-29 | OpenAI | gpt-6.1-sol | CI security workflow (#34) | ~4 files | yes | none | actionlint | — | — | — | Codex sandbox | SHAs verified correct |
| 2026-10-29 | OpenAI | gpt-6-luna | Dependabot config (#40) | 1 file | yes | TypeScript ignore rule fixed | n/a | — | — | — | Codex sandbox | Missed TS6→7 risk |
| 2026-10-29 | OpenAI | gpt-6-luna | Docs naming reconcile (#52) | ~6 files | partly | invented schema placements; missing tables | n/a | — | — | — | Codex sandbox | Ignored "don't invent names" instruction; needs review on judgement-heavy docs |
