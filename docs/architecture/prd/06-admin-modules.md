# 06 — Admin-defined custom modules

## Product intent
An organization admin can create a structured page tailored to a job niche (e.g. `Zorg`, `Techniek`, `IT`, `Logistiek`) without deploying code. **Modules are metadata-driven data schemas and views, not third-party executable plugins.** This constraint is security-critical for MVP.

## Module builder P0
- Choose title, slug, icon, help text, category and eligible roles.
- Configure field types: text, long text, integer, decimal, currency, date, boolean, single/multi-select, safe URL, reference to vacancy/candidate/client, and file reference (approved class only).
- Configure requiredness, defaults, UI ordering, list columns, filters, sorting, limited visibility and sensible validation constraints.
- Attach module to vacancy category; provide recruiter view, edit form and candidate/job linking.
- Preview draft, then publish immutable schema revision; keep version number and audit publisher.
- Allow archive/deactivation; never hard-delete a module containing active records without migration/deletion workflow.

## Model
`module_definitions(id, workspace_id, slug, status, published_revision)`; `module_revisions(id, definition_id, schema_json, ui_json, created_by, created_at)`; `module_records(id, workspace_id, definition_id, revision_id, parent_entity_id, encrypted_payload, created_by, updated_at)`; `module_access_policies`.

## Safety/validation
- Server validates forms against approved JSON Schema subset; encrypted payloads and explicitly approved deterministic lookup indexes only.
- No arbitrary JS, SQL, HTML injection, custom API endpoints, SQL expressions, server-side code, or browser scripting.
- Enforce max modules, records, fields, string size, schema depth and query complexity per plan.
- Tenant-aware references, RBAC, audit, data export/erasure and retention policies apply to custom content.
- HTML/markdown rendered safely with sanitization and restrictive Content Security Policy.
- UI rendering stays inside a sandboxed component inventory with no arbitrary dynamic imports.

## Example: `IT-profiel`
Fields: `programmeertalen` multi-select; `cloudplatform` multi-select; `ervaring_jaren` integer; `werkvorm` (`hybride`,`op locatie`,`remote`); `tarief` EUR decimal; `certificeringen` text. Vacancy page displays IT-specific information; candidate profile may reference the category-specific record.

## P1/P2
Safe conditional visibility rules, approval workflows, computed non-sensitive fields, templates marketplace vetted by platform, and versioned schema migrations with dry-run and rollback. Never open an unsandboxed extension execution environment without separate threat model.
