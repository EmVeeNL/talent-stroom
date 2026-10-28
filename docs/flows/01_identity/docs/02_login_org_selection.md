# Login and organization selection

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `02_login_org_selection`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **login and organization selection** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Begin login.
- **B** (process): Authenticate passkey / password / OIDC.
- **C** (decision): Risk check and required MFA.
- **D** (error): Challenge / deny with audit.
- **E** (process): List active memberships.
- **F** (decision): One active organization?.
- **G** (process): Show organization picker.
- **H** (process): Bind session to selected organization.
- **I** (end): Open workspace.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Fail | D |
| C | Pass | E |
| E | Continue | F |
| F | No | G |
| F | Yes | H |
| G | Select | H |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/02_login_org_selection.mmd`
- Vector image: `../images/02_login_org_selection.svg`
- High-resolution raster image: `../images/02_login_org_selection.png`
