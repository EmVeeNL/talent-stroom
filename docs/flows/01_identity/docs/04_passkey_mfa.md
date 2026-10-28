# Passkey enrollment and MFA recovery

**Product:** TalentStroom  
**Domain:** `01_identity`  
**Flow ID:** `04_passkey_mfa`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **passkey enrollment and mfa recovery** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Authenticated user opens security settings.
- **B** (decision): Recent authentication required.
- **C** (process): Reauthenticate.
- **D** (process): Register WebAuthn passkey.
- **E** (decision): Verify attestation / challenge / origin.
- **F** (error): Discard credential and alert.
- **G** (process): Store public key and credential metadata.
- **H** (process): Offer TOTP + recovery codes.
- **I** (end): Log enrollment and notify user.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | No | C |
| C | Continue | D |
| B | Yes | D |
| D | Continue | E |
| E | Fail | F |
| E | Pass | G |
| G | Continue | H |
| H | Continue | I |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/04_passkey_mfa.mmd`
- Vector image: `../images/04_passkey_mfa.svg`
- High-resolution raster image: `../images/04_passkey_mfa.png`
