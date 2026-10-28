# Diagram & Workflow Design Standards

- Mermaid `flowchart TD` is the editable source of truth.
- Diagrams explicitly model failed authorization, retries, expiry, denial and reversals when relevant.
- Node types: start/end (oval), decision (diamond), processing (rectangle), error (red).
- Identity and application authorization are server-side; UI gating is never sufficient.
- Secrets, plaintext PII, raw bearer tokens, and long-lived credentials must not be included in events or logs.
- Do not share cached data across organization boundaries; revocation checks must bypass stale public caches.
- DDL and API schemas, not these business flow diagrams, define data types and endpoint validity.

## BDD conversion template

```gherkin
Feature: Organization-scoped recruitment workflow
  Scenario: An unauthorized user cannot access another organization
    Given a user belongs only to organization A
    When they request a record belonging to organization B
    Then the API refuses access
    And the record's plaintext is not returned
    And a security event is recorded without personal data
```
