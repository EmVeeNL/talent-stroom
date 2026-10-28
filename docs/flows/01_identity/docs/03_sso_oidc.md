# Social login and enterprise OIDC

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `03_sso_oidc`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **social login and enterprise oidc** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): User chooses Google / Apple / OIDC.
- **B** (process): Create state nonce PKCE.
- **C** (process): Redirect to identity provider.
- **D** (decision): Validate callback signature state nonce.
- **E** (error): Reject login and record security event.
- **F** (process): Resolve verified identity to user.
- **G** (decision): Check invitation and membership.
- **H** (process): Request authorized onboarding.
- **I** (process): Risk step-up MFA if applicable.
- **J** (end): Continue to organization selection.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Invalid | E |
| D | Valid | F |
| F | Continue | G |
| G | Missing | H |
| G | Found | I |
| H | Approved | I |
| I | Continue | J |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/03_sso_oidc.mmd`
- Vector image: `../images/03_sso_oidc.svg`
- High-resolution raster image: `../images/03_sso_oidc.png`
