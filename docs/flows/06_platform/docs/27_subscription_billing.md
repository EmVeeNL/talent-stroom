# Plans, Stripe webhooks and entitlements

**Product:** TalentStroom  
**Domain:** `06_platform`  
**Flow ID:** `27_subscription_billing`  
**Status:** Design baseline — engineering review required

## Purpose

This flow defines the expected production behavior for **plans, stripe webhooks and entitlements** in TalentStroom's Dutch-first, multi-organization recruitment platform.

## Steps and decisions

- **A** (start): Admin chooses plan or updates subscription.
- **B** (process): Hosted checkout / billing portal.
- **C** (process): Payment provider sends signed webhook.
- **D** (decision): Verify signature, timestamp and event id.
- **E** (error): Reject and alert.
- **F** (process): Deduplicate event and reconcile provider state.
- **G** (process): Update workspace entitlements transactionally.
- **H** (process): Apply grace/read-only policy without data loss.
- **I** (end): Audit and notify account admin.

## Decision / transition matrix

| From | Condition | To |
|---|---|---|
| A | Continue | B |
| B | Continue | C |
| C | Continue | D |
| D | Invalid | E |
| D | Valid | F |
| F | Continue | G |
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

- Editable Mermaid: `../mermaid/27_subscription_billing.mmd`
- Vector image: `../images/27_subscription_billing.svg`
- High-resolution raster image: `../images/27_subscription_billing.png`
