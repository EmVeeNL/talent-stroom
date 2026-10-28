# 16 — Release roadmap and gates

This is an ordered roadmap with indicative milestones, not guaranteed dates. Validate effort after staffing and vendor proof of concept.

| Phase | Milestone | Key deliverables | Exit gate |
|---|---|---|---|
| 0 | Discovery and security decisions | Customer interviews, trademark/domain check, threat model, Dutch legal assessment, architecture ADRs | Approved PRD/risks |
| 1 | API/contracts first | Hono Worker, TS7, org identity models, OpenAPI, schema migrations, GitHub CI | Contract + tenant tests |
| 2 | Encryption foundation | KMS PoC, per-record envelope encryption, encrypted files, blind-index PoC, key rotation, database backups | External crypto review + DB leak tabletop |
| 3 | Core backend | Clients, candidates, vacancies, applications, stage history, tasks, shortlists, audit | BDD API green |
| 4 | Frontend and i18n | Vite React, design system, NL copy, org chooser, autolock, accessible flows | User tests + a11y |
| 5 | AI/translation + custom modules | CV parsing, translation, approvals, module builder, cost/quota control | Prompt-injection tests + scope guard |
| 6 | Client collaboration and billing | Public portal, feedback, notifications, Stripe-like billing, consent/retention workflows | Security/privacy reviews |
| 7 | Private alpha | 2–3 agencies, migration assistance, metrics, bug triage | Core journey completion |
| 8 | Closed beta + public website | 5–10 agencies, Astro website, demos/tutorials, docs, onboarding forms | Reliability and trial conversion proof |
| 9 | Public v1 | Production runbooks, support, pricing, incident playbook, launch | Release checklist signed |
| 10 | v1.x | CSV import, mail/calendar integrations, enhanced module templates | Measured demand |
| 11 | v2 desktop exploration | Rust/Tauri shell POC + device security posture | Separate go/no-go |

## Pre-beta acceptance
Signed DPA/subprocessor docs and privacy notices; threat model and pentest; 0 unresolved critical/high findings; rate limits, uploads, AI and sharing abuse defenses; test restore; incident contacts; product analytics without PII; human-readable user guide; automated cancellation/export/deletion; staging/production separation.

## Risk-driven order
**Do not build UI on plaintext DB schema and retrofit encryption later.** Define encryption and search tradeoffs after API/domain contracts but before candidate data implementation. Separately prototype Worker ↔ EU Postgres ↔ external KMS performance before committing.
