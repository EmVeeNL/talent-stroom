# Hono API request, tenant isolation, RLS

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `23_api_request_tenancy`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **hono api request, tenant isolation, rls** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Browser / desktop / developer API request.
- **B** (process): Cloudflare WAF and rate limit.
- **C** (decision): Authenticate and verify selected membership.
- **D** (error): Return 401 or 403, audit.
- **E** (process): Validate Zod/OpenAPI request and permissions.
- **F** (process): Begin Neon transaction; set scoped tenant context.
- **G** (process): Apply RLS plus composite tenant FK constraints.
- **H** (end): Commit and emit outbox; redact response.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Denied | D |
| C | Granted | E |
| E | Continue | F |
| F | Continue | G |
| G | Continue | H |

## Invariants and implementation checks

- Every organization-owned read and write must verify active membership, appropriate permissions, and PostgreSQL tenant scope.
- Failed operations must not produce a partially committed business outcome. Use transactions and idempotency as appropriate.
- Sensitive personal data and credentials must never enter application logs, analytics, URLs, or shared caches.
- Privileged or irreversible actions require immutable security/audit events with appropriate minimization.
- Automated tasks and AI processing must tolerate retries, race conditions, revoked access, and dependency outages.
- Diagram paths specify user-visible and security-critical behavior; endpoint names and detailed event schemas remain implementation decisions.

## Artifacts

- Editable Mermaid: `../mermaid/23_api_request_tenancy.mmd`
- Vector image: `../images/23_api_request_tenancy.svg`
- High-resolution raster image: `../images/23_api_request_tenancy.png`
