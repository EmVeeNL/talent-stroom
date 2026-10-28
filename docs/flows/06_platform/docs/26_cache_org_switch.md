# Cache, invalidation and organization switching

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `26_cache_org_switch`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **cache, invalidation and organization switching** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Authenticated read.
- **B** (process): Compute cache key tenant/user/role/version.
- **C** (decision): Sensitive or revoked content?.
- **D** (process): Bypass shared cache; fetch private source.
- **E** (process): Check bounded tenant-scoped cache.
- **F** (decision): Hit?.
- **G** (process): Read Neon and cache safe projection.
- **H** (end): Return result with proper Cache-Control.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Yes | D |
| D | Continue | H |
| C | No | E |
| E | Continue | F |
| F | Miss | G |
| G | Continue | H |
| F | Hit | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/26_cache_org_switch.mmd`
- Vector image: `../images/26_cache_org_switch.svg`
- High-resolution raster image: `../images/26_cache_org_switch.png`
