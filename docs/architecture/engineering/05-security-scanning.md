# Security scanning

The public repository runs `.github/workflows/security.yml` on pull requests to
`main`, pushes to `main`, and every Monday at 04:23 UTC. Superseded PR runs are
cancelled. This implements issue #34 under accepted
[ADR 0005](../../adr/0005-dependency-supply-chain-policy.md).

- **CodeQL** scans JavaScript/TypeScript and GitHub Actions workflows using
  `build-mode: none`; no application build or dependency installation is needed.
  Findings appear in the repository's Security tab and PR code scanning checks.
  Only this job receives `security-events: write`.
- **Dependency review** runs only on PRs and rejects newly introduced high or
  critical vulnerabilities across runtime, development, and unknown scopes.
  Its license denylist covers GPL-2.0, GPL-3.0, AGPL-3.0 (including `-only` and
  `-or-later` identifiers), and SSPL-1.0. Other recognized licenses are allowed;
  unrecognized license expressions need investigation. Failure summaries are
  posted to same-repository PRs using only `pull-requests: write`; comments are
  disabled for forks and Dependabot, whose tokens are read-only. The job summary
  remains available without comments.
- **Audit** uses the same Node version, Corepack/pnpm setup, store cache, and
  frozen install as `ci.yml`, then runs `pnpm audit --audit-level high --prod`.
  It checks production and optional dependencies across the workspace, including
  existing dependencies, and fails for high or critical advisories. pnpm 12
  queries the npm registry's `/-/npm/v1/security/advisories/bulk` endpoint: audit
  requires network access, works without extra configuration against the public
  registry, and is not an offline scan. Registry errors fail the job.

For a finding, inspect the affected code or dependency path and advisory, then
fix the code, upgrade to a patched dependency, or replace the dependency with a
compatible alternative. Add a regression test where applicable and rerun the
failed check. Document false positives or accepted risk with evidence and human
review; do not silently lower thresholds or add exceptions. Urgent dependency
updates must follow ADR 0005's review requirement for the seven-day release-age
exception. CodeQL alert dismissal also needs a documented reason.

Secret scanning and push protection are enabled at repository level in GitHub's
security settings; they run independently of this workflow. If a secret is
detected, revoke or rotate it immediately and follow up on the alert. Never put
the secret itself in an issue, PR, or workflow log.

Action references are pinned to full release commit SHAs with tag comments.
When updating them, resolve the tag (dereferencing annotated tags) and verify
that the release is at least seven days old. Dependency review v5 still supports
the deprecated `deny-licenses` input; check its migration guidance before a
future major upgrade.
