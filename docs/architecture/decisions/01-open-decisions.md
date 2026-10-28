# Open decisions, questions and assumptions

These are non-blocking defaults for this documentation pack; validate before production implementation.

| ID | Decision / question | Starting recommendation | Why it matters |
|---|---|---|---|
| D01 | Final legal brand/domain | Decided: TalentStroom (Wervlo was working name); trademark/domain clearance pending | Trademark/IP |
| D02 | Entity geography | EU-region Postgres/KMS, validate every transfer | Residency + GDPR |
| D03 | Auth provider | Choose by multi-org, passkey, enterprise SSO, policy/SCIM support | Security/cost |
| D04 | Password expiry | Policy-configurable only; strongly prefer passkey + MFA | Modern guidance vs request |
| D05 | Encryption scope | Record-level envelope encrypt candidate PII + files | Query and cost trade-off |
| D06 | Search scope | Exact blind indexes first; evaluate skills search separately | Encryption/search tension |
| D07 | Admin module P0 breadth | Field schema + pages, no code or scripting | Safety |
| D08 | AI vendor/model | Benchmark privacy, accuracy and completed-task cost | No stable "best" model |
| D09 | Dutch retention defaults | Per purpose and agency lawfully justified policy | Agency vs employer differences |
| D10 | Offline desktop | Not in v2 initial shell | Encryption/device exposure |
| D11 | Price tiers | Validate with Dutch paid pilots | Unit economics |
| D12 | Platform operator decrypt access | Break-glass only, logged and approved | Insider threat |
| D13 | Frontend | React/Vite application, Astro public website | Best tool by surface |
| D14 | Worker PG driver and KMS | Prototype end-to-end encryption p95 first | Runtime compatibility |
| D15 | Portal viewers | Bearer links v1, optional email verification v1.x | Security/usability |

## Missing pieces now explicitly included
Observability, disaster recovery, developer API auth and abuse protection, SBOM/supply chain, secrets management, cross-tenant BDD, legal/DPIA review, support ownership, accessibility, migrations, key recovery, SaaS usage limits, app ownership, data portability, customer onboarding, incident and vulnerability disclosure, dependency update and deprecation policies.

## Later stakeholder questions
1. Will agencies need NL-only processing as a contractual requirement, or is EU residency enough?
2. Should client portals require one-time email verification by default for confidential executive search?
3. Is searchable encrypted skills text mission-critical on day one?
4. Which niche vertical should provide the first custom module template?
5. Is the first beta invite-only and assisted, or self-serve?
These need answers during discovery, but are not blockers to reading and using the pack.
