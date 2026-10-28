# 13 — BDD and testing strategy

## Working practice
Product owner writes observable acceptance criteria; QA + engineering turn them into Gherkin scenarios **before** implementation. Use Cucumber/Playwright-BDD or equivalent backed by Playwright for browser and typed API test fixtures. Feature files in English for team consistency, Dutch strings asserted by UI/i18n tests.

## Example `organization-selection.feature`
```gherkin
Feature: Organization boundary
  Scenario: A recruiter selects an organization after logging in
    Given I am a verified member of "Bureau A" and "Bureau B"
    When I authenticate with my passkey
    Then I see the organization selection screen
    When I select "Bureau A"
    Then my active organization is "Bureau A"
    And I cannot read candidates belonging to "Bureau B"

  Scenario: A removed member cannot retain access
    Given I am logged into "Bureau A"
    When an administrator revokes my membership
    Then all further API requests for "Bureau A" are denied
```

## Example `encryption.feature`
```gherkin
Feature: Confidential candidate storage
  Scenario: A database dump excludes readable candidate identity
    Given a candidate with email "test@example.nl" was saved
    When an authorized test harness inspects the database row
    Then the email is not present in plaintext
    And the row contains a wrapped data key
    And the record cannot decrypt without the external KMS

  Scenario: Swapped ciphertext is rejected
    Given candidates exist in different organizations
    When their ciphertext envelopes are swapped in a test database
    Then authenticated decryption fails
```

## Test layers
Unit: field validation, retention rules, stage state machine, permissions, translation formatting, crypto wrappers. Integration: PG/KMS stubs and real staging service, blob, queues, subscriptions. Contract: OpenAPI backward compatibility. E2E: onboarding→CV→vacancy→pipeline→shortlist→feedback→placement. Security: tenant boundary, IDOR, XSS, CSRF, injection, upload, SSRF, prompt injection, credential stuffing, MFA recovery. Performance: 10k candidate records per org and concurrent user journey load. Resilience: queue replay, DB failover, KMS outage, restoration.

## Release gates
Zero unresolved critical/high vulnerabilities; tenant isolation suite green; P0 BDD acceptance green; accessibility keyboard and WCAG 2.2 AA critical flows pass; documented performance targets observed; backups restored; security/AI/privacy sign-off for material changes.
