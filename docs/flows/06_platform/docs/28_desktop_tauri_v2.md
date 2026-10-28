# Tauri v2 desktop client security and sync

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `28_desktop_tauri_v2`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **tauri v2 desktop client security and sync** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Launch signed desktop shell.
- **B** (process): Use system browser OIDC with PKCE/passkeys.
- **C** (process): Verify callback and active organization.
- **D** (process): Store session in platform secure store.
- **E** (decision): Fetch minimal encrypted local data?.
- **F** (process): Keep online-only session.
- **G** (process): Encrypt optional offline cache with device key.
- **H** (process): Sync via versioned API; detect conflicts.
- **I** (end): Lock on inactivity / remote revoke.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Continue | E |
| E | No | F |
| E | Yes | G |
| F | Continue | H |
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

- Editable Mermaid: `../mermaid/28_desktop_tauri_v2.mmd`
- Vector image: `../images/28_desktop_tauri_v2.svg`
- High-resolution raster image: `../images/28_desktop_tauri_v2.png`
