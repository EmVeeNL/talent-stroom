# 03 — Functional requirements & acceptance

P0 = launch blocker; P1 = early follow-up; P2 = later. All write endpoints require tenant authorization and auditability where sensitive.

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| AUTH-01 | Register/sign in; email verification | P0 | Unverified accounts cannot access tenant data |
| AUTH-02 | Multi-organization memberships; choose active organization | P0 | Every API request has verified membership and active context |
| AUTH-03 | Organization invitations, roles, removal | P0 | Revoked membership invalidates org access |
| CAND-01 | Candidate CRUD, notes, tags and encrypted documents | P0 | Scoped and searchable in authorized context |
| CAND-02 | PDF/DOCX upload, scan, parse and manual review | P0 | Failure preserves manual path; no fabricated fields |
| CAND-03 | Duplicate hints | P0 | No automatic merges |
| VAC-01 | Client contacts, vacancies and recruiter ownership | P0 | Valid tenant-safe foreign keys |
| PIPE-01 | Applications link candidates to vacancies | P0 | Unique tenant/candidate/vacancy triple |
| PIPE-02 | Drag/drop and accessible stage selector | P0 | Stage persisted, audit event, rollback on failure |
| SHARE-01 | Shortlist snapshots with scoped, revocable, expiring links | P0 | Expired/revoked link cannot access content or CV |
| SHARE-02 | Ratings, decisions and optional feedback | P0 | Feedback tied to shortlist item and visible to recruiters |
| TASK-01 | Manual tasks; deterministic follow-up triggers | P0 | Retry doesn't duplicate task |
| PLACE-01 | Placement lifecycle | P0 | One active placement per application; history preserved |
| I18N-01 | Dutch UI, English fallback and formatting | P0 | Language switch doesn't modify source records |
| AI-01 | Human-reviewed CV extraction, drafting and translation | P0 | Outputs labeled; user approves external communications |
| MOD-01 | Admin-created structured category modules | P0 limited | Schema-validated fields and views, no user-executable code |
| BILL-01 | Subscription and seat entitlements | P0 | Server enforced and tested against billing replay |
| PRIV-01 | Export, erasure and retention review | P0 | Covers documents, caches, exports, derived data |
| DOC-01 | OpenAPI documentation and versioned API | P0 | Spec and API validated in CI |
| MOD-02 | Module workflows and computed rules | P1 | Sandboxed and audited rule language only |
| AI-02 | Semantic matching and rankings | P2 gated | Separate AI Act review before development |

## Suggested default stages
`Nieuw`, `Gescreend`, `Voorgedragen`, `In gesprek`, `Aanbod`, `Geplaatst`, `Afgewezen`; customizable stages after MVP. Translation maps display labels, never stored enum identifiers.

## Definition of done per story
BDD scenarios approved; implementation behind reviewed API contract; unit/integration/tenant isolation tests pass; a11y and performance verified; structured audit and telemetry added; data lifecycle documented; privacy and threat model updated where applicable; release notes and docs published.
