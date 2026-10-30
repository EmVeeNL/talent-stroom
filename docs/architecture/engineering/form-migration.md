# Web forms (#426)

Implements the Form decision in accepted ADR 0015 with `@tanstack/react-form` 1.33.5 and the existing Zod 4.6.7, without an adapter. Catalog and lockfile use the normal seven-day release policy.

`apps/web/src/forms.tsx` owns field adapters, issue-code translation and the summary subscription. Fields subscribe to their own state; summary subscriptions contain metadata and submit lifecycle only. Use `form.AppForm`, `form.AppField` and `submitForm(form)` for new forms, with a Standard Schema validator on blur and submit. Always parse the value explicitly before the submit operation: Standard Schema validation does not replace raw form values with transformed output.

Form 1.33.5 checks field validity before re-running form validators. `submitForm` refreshes synchronous schema validation before entering its submission lifecycle, so stale blur errors cannot consume the first keyboard/checkbox submission. It also rejects concurrent submissions while the form is submitting. Do not bypass this helper. Current schemas are synchronous; asynchronous schemas would require revisiting this boundary and its concurrency tests.

`ErrorSummary` is an exported UI component. A failed submit focuses the labelled region, each link focuses its control (including a radio group), and blur validation does not move focus. Field adapters use stable IDs and existing inline error semantics. The summary is not a second live region. Generic asynchronous failures retain the existing single alert. Only allowlisted organization problem codes become inline errors; raw server/schema messages and submitted values are never rendered as validation messages.

## Authentication review

- `AuthFlow.tsx`: replaces FormData with field state and Standard Schema validation. Shared sign-in, sign-up, email and new-password schemas come from the contracts public API. Terms acceptance is presentation-only. Request schemas are parsed before constructing the existing Better Auth payloads; presentation fields never enter transport. Email and password values are not trimmed or normalized. Password limits, autocomplete, visibility controls, callback URLs, endpoints, generic server error keys and abort handling are preserved.
- `OrganizationPicker.tsx`: parses `CreateOrganizationRequest` (including name trimming) and `OrganizationIdParam` before existing Query mutations. Selection/confirmation and create forms share the existing busy guard. Query's membership check and the server's organization authorization remain authoritative. Allowlisted `ProblemError.fields` are translated by code; other errors retain existing handling, including expiry.
- `query.ts`: adds `authSubmit` using the existing private mutation runner, cancellation signal and generation guard for registration, password reset and mail requests. The mutation uses a fixed key and undefined variables, carries request fields only in the invocation closure and is removed on settlement. Sign-in and organization changes retain their existing mutation paths.
- `forms.tsx`: Form 1.33.5 emits state/options to its devtools event client even without a devtools panel, and can queue these events. Its publicly exported singleton's `emit` and `on` methods are disabled before forms mount, preventing value broadcasts, queued payloads and devtools commands. No Form devtools are installed. Recheck this explicit integration boundary on every Form upgrade; tests assert that editing/submitting never constructs devtools payloads.
- `auth.ts`, API code, guards, tenant scoping and one-use token capture are unchanged. Existing auth/App assertions are unchanged. No values are added to logs, persistence, analytics or query keys.

Contact, profile settings, validation and Agenda use local schemas and local confirmation/state only. No demo submit calls a backend. Agenda resets form state on each dialog opening and retains all-day and end-after-start validation.

## Handoff

Run `pnpm check` and `pnpm build`. The orchestrator must run `pnpm visual` and review the authentication-sensitive diff before committing. No Chromium/server is started by this worktree task. For any subsequent manual dev session use port 5202; port 5173 belongs to the owner.

Validation: the full sequential package test run passed (163 web, 383 UI, 11 contracts; existing database-dependent API/database tests skip without database configuration). Both tests that timed out under parallel package load passed in isolation and in the complete sequential run; no timeout or test assertion was weakened. `pnpm build` passed; the emitted shared forms chunk is 65.88 kB / 15.77 kB gzip, with Zod in a separate shared schema chunk (85.61 kB / 24.40 kB gzip). These are final chunk sizes, not an incremental baseline comparison.
