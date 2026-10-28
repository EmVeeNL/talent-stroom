# TalentStroom — Dutch-first recruitment platform

**Documentation baseline:** 2026-10-28 · **Status:** engineering design proposal · **Language:** English specifications; Dutch-first product UX.

Product name **TalentStroom** (Wervlo was the earlier working name); trademark/domain clearance is pending. Dutch tagline: **Werven zonder gedoe.** This pack is a product/architecture planning baseline, not deployed code, audited security, or legal advice.

## Reading order
1. `prd/01-vision-market.md` — positioning, customers, outcomes
2. `prd/02-personas-workflows.md` — recruiting workflows
3. `prd/03-functional-requirements.md` — feature requirements and acceptance
4. `prd/04-localisation-translation.md` — Dutch-first language strategy
5. `prd/05-ai-assistant.md` — AI architecture and guardrails
6. `prd/06-admin-modules.md` — secure tenant-defined modules
7. `architecture/01-system-api.md` — API-first architecture
8. `architecture/02-data-multitenancy.md` — domain and membership model
9. `security/01-encryption-key-management.md` — breach-resistant envelope encryption
10. `security/02-security-identity-privacy.md` — identity, secure development, Dutch/EU privacy
11. `architecture/03-caching-operations.md` — caching, infrastructure, recovery
12. `engineering/01-monorepo-standards.md` — TS7, pnpm, Turbo, standards
13. `engineering/02-bdd-testing.md` — BDD and quality gates
14. `engineering/03-git-ci-cd.md` — secure GitHub delivery
15. `engineering/04-ai-development-playbook.md` — Claude/Codex model routing and context budget
16. `roadmap/01-delivery-roadmap.md` — phased plan and definition of done
17. `roadmap/02-desktop-rust.md` — optional desktop roadmap
18. `marketing/01-go-to-market.md` — positioning and launch
19. `marketing/02-website-and-docs.md` — beta website, guides and developer portal
20. `decisions/01-open-decisions.md` — decisions and explicit assumptions
21. `references.md` — authoritative sources and verification notes

**Critical security distinction:** individually encrypted records protect against a *database-only* breach if the keys live elsewhere. No design guarantees confidentiality when an attacker also controls an authorized decryption service, live sessions, or endpoints. Threat models must test those cases.
