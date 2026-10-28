# 14 — Git workflow, CI/CD and private-code policy

## Repository policy
GitHub **private** organization repo; prevent public forks where supported; mandatory 2FA/passkeys for maintainers; CODEOWNERS and branch protection. `main` always releasable. Short-lived feature branches `feat/<ticket>-<slug>`, `fix/`, `sec/`; PR reviews mandatory; squash merge; no direct main pushes. Renovate/Dependabot in controlled batches.

## PR checklist
Linked issue and BDD scenarios; security impact/PII map; OpenAPI compatibility; migrations; logs redaction; tests; i18n; docs; screenshots for UI. AI-generated code is labeled in PR description; a human author takes responsibility for review and test evidence.

## CI stages
1. Frozen install/cache with verified lockfile.
2. Secret scan, dependency audit, license review and SAST.
3. Formatting/lint, TypeScript 7 typecheck, package boundary checks.
4. Unit tests, BDD API tests, contract/OpenAPI diff, generated SDK check.
5. Integration tests with ephemeral PostgreSQL and mocked/controlled KMS.
6. Build Worker/web/site/docs and smoke tests.
7. Deploy ephemeral PR preview (synthetic non-production data only).
8. After approval, promote immutable artifact to staging; execute E2E/security tests.
9. Production deploy with environment approvals, Cloudflare workload-scoped credentials/OIDC where supported, deployment canary and rollback.

## Versioning
SemVer for public API and SDK; `/v1` API maintained with deprecation period; independent application release versions via Changesets or release automation. Publish changelog, migration guide and versioned OpenAPI per release. Enforce expand/migrate/contract schema rollout.

## Secrets and isolation
Production secrets only in secret manager / Cloudflare secrets, never in GitHub workflow logs or preview projects. Separate staging and production accounts, databases, KMS keys and dataset. Restrict artifact access and retention. CI runners cannot dump production candidate plaintext. Generate SBOM and record provenance for each production release.
