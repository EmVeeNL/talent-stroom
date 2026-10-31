# 0016 — Calendar sync with Microsoft 365 and Google Calendar

- **Status:** Proposed
- **Date:** 2026-10-31
- **Resolves:** — (informs D02 for calendar data; overlaps spike #307 of epic #306)
- **Issue:** #455 (epic #452; overlaps #306/#307)

> This is a desk study. Vendor facts come from vendor documentation read on 2026-10-31 and are linked inline; anything marked _verify_ must be confirmed in the PoC (follow-up F2) before this ADR is accepted. No OAuth apps, cloud resources or test tenants were created, so there are **no measurements yet**: section "Measurement plan" lists what the PoC must measure and the targets.

## Context

The agenda (#454, `docs/agenda-demo.md`) is a local demo: appointments have a title, type (`gesprek`, `intake`, `deadline`), description, start/end or all-day range, location, optional online link, organiser and internal attendees. Recruiters live in Outlook or Google Calendar, so without sync they double-enter interviews. Epic #306 (Phase 10) plans OAuth mail and calendar integrations; its spike #307 decides the overall depth (calendar only, send, selective logging). This ADR decides the **calendar** part and is written so #307 can reuse its token, consent and tenancy model for mail.

Constraints:

- **Candidate data is the asset we protect.** Candidate PII is envelope-encrypted per record (ADR 0008, ADR 0011). A calendar event in Microsoft 365 or Google is plaintext to the provider, to the user's delegates and assistants, to tenant admins and eDiscovery, to mobile devices and to anyone the calendar is shared with. Anything we write there leaves our encryption boundary for good.
- **Roles under AVG/GDPR.** The agency is controller of candidate data; TalentStroom is its processor. The agency's Microsoft 365 or Google Workspace tenant is the agency's own processor under its own contract. Pushing an event is a transfer to that other processor, made on the controller's instruction, so it must be an explicit, documented, opt-in feature (DPA annex, privacy notice, DPIA screening), not a default.
- **Multi-organization.** A recruiter can belong to several organizations (`docs/architecture/architecture/02-data-multitenancy.md`). Appointments of organization A must never reach a calendar connected in the context of organization B. Every read/write verifies membership and organization scope server-side (AGENTS.md rule 2).
- **Runtime.** Hono on Cloudflare Workers: no Node-only SDKs, plain `fetch`, 6 concurrent outbound connections per invocation, no long-lived processes. Background work needs Cloudflare Queues and Cron Triggers, which `apps/api/wrangler.jsonc` does not have yet.
- **No personal data in logs, URLs, job payloads or shared caches** (rule 3).
- **Hosting.** The API runs on `*.workers.dev` (ADR 0004). OAuth consent screens and Google app verification need an authorized domain we own; see open question 1.
- **Rule 1.** The implementation stores OAuth tokens (authentication-adjacent), uses `@talentstroom/crypto` for a new record type (encryption), adds tenant-scoped tables (tenancy) and migrations. **This ADR must be accepted before any of that is built.** The spike changes documentation only.

## Options considered

### 1. Microsoft Graph calendar API, delegated OAuth (authorization code + PKCE)

- **Scopes.** Writing events needs delegated `Calendars.ReadWrite`, which grants read/write to **all** of the user's calendars; Graph has no "only calendars this app created" scope. `offline_access` is needed for a refresh token; `openid` + `email` give us the connected account for display. Free/busy (`getSchedule`) works with `Calendars.ReadBasic` (_verify_ least-privileged permission per endpoint). `Calendars.ReadWrite` does not require admin consent by default, but many tenants restrict user consent to verified publishers or block it, so a **verified publisher** (Microsoft Partner Network) and an admin-consent path are needed.
- **Containment.** We create one dedicated secondary calendar ("TalentStroom") in the user's mailbox and only ever touch that calendar's ID. That is enforced by our code, not by the token: a stolen token can still read the whole calendar.
- **Change notifications.** Subscriptions on Outlook events last at most 10,080 minutes (under 7 days), or 1,440 minutes with resource data ([subscription lifetime](https://learn.microsoft.com/en-us/graph/api/resources/subscription)); `clientState` (≤ 128 chars) lets us check a notification came from Graph; lifecycle notifications (`reauthorizationRequired`, `subscriptionRemoved`, `missed`) need handling. Delta queries (`calendarView/delta`) give incremental sync.
- **Limits.** Per app per mailbox: 10,000 requests per 10 minutes and **4 concurrent requests** ([Outlook limits](https://learn.microsoft.com/en-us/graph/throttling-limits)); 429 with `Retry-After`. Our expected load (tens of writes per recruiter per day) is several orders of magnitude below this.
- **Idempotency.** `transactionId` on event creation lets Graph deduplicate retried creates (_verify_ semantics); our own ID goes in a single-value extended property.
- **Pros:** covers most Dutch boutique agencies (Microsoft 365 is dominant); mature API; push plus delta.
- **Cons:** broad scope we cannot narrow; consent friction in managed tenants; refresh tokens rotate on use (we must store the newest one atomically); publisher verification work.

### 2. Google Calendar API, OAuth (authorization code + PKCE)

- **Scopes** ([Calendar scopes](https://developers.google.com/workspace/calendar/api/auth)): `calendar.app.created` lets the app create secondary calendars and manage events **only on calendars it created**. That is genuine least privilege, enforced by Google. `calendar.freebusy` gives availability only, no event details. Broader scopes (`calendar.events`, `calendar.events.owned`, `calendar`) are not needed.
- **Verification.** Calendar scopes other than the narrowest need Google OAuth app verification (brand verification, scope justification; _verify_ whether `calendar.app.created` and `calendar.freebusy` are classified sensitive). Until verified, users see an "unverified app" warning and there is a user cap; in "testing" publishing status refresh tokens expire after 7 days (_verify_). Workspace admins can block or allow-list third-party apps.
- **Granular consent.** Users can untick scopes on the consent screen; we must check the granted scopes in the token response and treat a partial grant as "not connected" for that capability.
- **Push.** `events.watch` channels POST to an HTTPS URL with a valid certificate; notifications carry **no body**, only `X-Goog-*` headers including our channel `token` (≤ 256 chars); channels expire and are not renewed automatically ([push](https://developers.google.com/workspace/calendar/api/guides/push)). Changes are fetched with `events.list` and a `syncToken`; HTTP 410 means "full resync".
- **Idempotency.** Clients may choose the event `id` (base32hex), so a create can be retried safely with an ID derived from our appointment ID.
- **Revocation.** `https://oauth2.googleapis.com/revoke` revokes the grant server-side.
- **Pros:** least-privilege scope that Google enforces; content-free push; real revocation endpoint.
- **Cons:** verification effort; quotas per project and per user (_verify_ in console); smaller share of our target market than Microsoft 365.

### 3. ICS subscription feed (read-only, secret URL)

The user pastes a per-user URL (`https://…/ics/<random token>`) into Outlook or Google.

- **Pros:** no OAuth, no provider tokens, works with any client (also Apple Calendar), trivially revocable server-side by rotating the token.
- **Cons:**
  - Read-only, so no conflict handling but also no write-back or free/busy.
  - The URL **is** the credential: it is forwarded, logged by proxies, synced to every device, and Google/Microsoft fetch it **from their servers**, so the content ends up with the provider anyway.
  - Refresh is controlled by the client, typically every few hours up to a day (_verify_), so moved or cancelled interviews show stale times; cancellations can linger.
  - Revoking the URL does not remove what the provider already cached.
  - Conflicts with the spirit of rule 3 (secrets in URLs) and with our bearer-link caution in D15.

### 4. CalDAV

- **Pros:** open standard; Apple iCloud, Fastmail and Nextcloud support it; two-way.
- **Cons:** Microsoft 365 / Exchange Online does **not** offer CalDAV; Google's CalDAV endpoint still needs Google OAuth, so it adds nothing over option 2. iCloud requires an app-specific password, i.e. we would store a password-equivalent with full calendar (and more) access. Niche for our market; high cost per user served.

### 5. Also considered

- **Unified calendar API vendor (Nylas, Cronofy and similar).** One integration for all providers, managed webhooks and token refresh. Rejected for now: a new subprocessor that holds the agency's calendar tokens and event content (extra DPA, transfer assessment, D02), per-seat cost, and vendor lock-in for a feature we can build on two well-documented APIs.
- **iCalendar invitations by email (iMIP, `METHOD:REQUEST`/`CANCEL`).** TalentStroom mails an `.ics` invite to the recruiter; updates reuse the `UID` with a higher `SEQUENCE`. No OAuth at all, works everywhere, one-way. Limitations: depends on the mail transport (#232), the invite still lands in the provider in plaintext, we cannot remove it on erasure, and users can edit their copy freely. A good **fallback** for users without Microsoft 365/Google, not the main path.
- **Application permissions (tenant-wide, admin-granted).** Lets us write to every mailbox in the agency without per-user consent. Rejected: tenant-wide blast radius (`Calendars.ReadWrite` application permission reaches every mailbox, including directors' and HR's), and the agency admin, not the recruiter, would be the only consent point. Can be revisited with Exchange application access policies or RBAC for Applications if an agency asks for it.

### Sync direction

- **Two-way sync** (import external events and edits into TalentStroom) means reading all of the user's calendar and storing third-party data (private appointments, other clients, doctor visits) that we do not need. It also needs per-field conflict resolution and would let an Outlook drag silently reschedule a candidate interview.
- **One-way push** (TalentStroom → provider) keeps TalentStroom the source of truth and stores nothing from the provider except IDs and change markers.
- **Free/busy read** (busy blocks only) solves the real two-way need, "don't plan over my dentist", without importing content.

## Decision

Recommendation: **options 1 and 2, delegated OAuth, one-way push into a dedicated TalentStroom calendar with minimal content, phased; ICS and CalDAV deferred.** Each phase is a separate follow-up issue and ships behind an organization-level feature flag that is off by default.

| Phase | Scope                                                                                               | Needs                                                   |
| ----- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| A     | Connect/disconnect; create/update/delete pushes for appointments the user organises or attends      | Tokens, Queue, Cron (token health), no public endpoint  |
| B     | Drift detection: notice when our event is moved or deleted in Outlook/Google, show it in the agenda | Webhook endpoint, subscription renewal, delta/sync tok. |
| C     | Free/busy overlay (busy blocks only) for planning                                                   | Separate opt-in scope (`calendar.freebusy`/`ReadBasic`) |

### 1. Scopes (least privilege)

| Provider        | Phase A/B                                                  | Phase C (separate, incremental consent) | Never requested                                    |
| --------------- | ---------------------------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Google          | `openid`, `email`, `calendar.app.created`                  | `calendar.freebusy`                     | `calendar`, `calendar.events`, `calendar.readonly` |
| Microsoft Graph | `openid`, `email`, `offline_access`, `Calendars.ReadWrite` | `Calendars.ReadBasic` (_verify_)        | `User.Read.All`, `Mail.*`, any application perm.   |

- Calendar consent is **separate from sign-in**. Signing in with Google or Microsoft (ADR 0006) keeps its sign-in-only scopes; we do not piggy-back calendar scopes on the sign-in grant or store calendar tokens in Better Auth's `auth_accounts`. Use separate OAuth clients (and for Microsoft a separate Entra app registration) so the calendar grant and its secret can be revoked or rotated without touching login.
- On Microsoft, the dedicated calendar is the only calendar our code addresses (calendar ID pinned in the connection row; every write path asserts it). We document honestly in the consent explanation that Microsoft's permission is broader than what we use.
- The token response's granted scopes are checked on every connect and refresh; a missing scope disables that capability, it never falls back to a broader request.

### 2. Connection model and tenant scoping

- A **calendar connection belongs to one membership**: `(organization_id, user_id, provider)`, unique. Connecting in organization B is a separate consent, a separate dedicated calendar ("TalentStroom — <organization name>") and a separate token, even for the same Google/Microsoft account.
- Only appointments of that organization where the user is organiser or attendee are pushed through that connection. A recruiter cannot push a colleague's appointment into their own calendar.
- Every job re-checks: membership active, connection active and in the same organization, appointment in the same organization and still visible to the user. Failure drops the job (no retry) and records a security event without PII.
- An organization admin enables the feature (and the content level, see 4) per organization; each user then connects individually. Admins see which members are connected, never their tokens or external calendars.
- Job payloads carry only IDs (`organization_id`, `connection_id`, `appointment_id`, operation, idempotency key). Handlers load content from the database.

### 3. Token storage, encryption and lifecycle

- **Refresh tokens** are stored only as an envelope (ADR 0011) with a new record type `calendar_connection`, under the organization's KEK, AAD bound to environment, organization and connection ID. A database-only leak reveals no tokens; copying a token envelope to another organization or row fails authentication. The connected account email (recruiter data, needed for display) is in the same envelope.
- **Access tokens** (about 1 hour) are never persisted, cached across requests or put in job payloads; a job refreshes when needed and keeps the token in memory for that invocation only.
- **Rotation races.** Microsoft can return a new refresh token on each use. Refresh is serialized per connection (row version compare-and-swap, or one Durable Object per connection if contention shows up in the PoC); the KMS call stays outside the database transaction (ADR 0007).
- **OAuth flow.** Authorization code with PKCE (S256), `state` stored server-side for 10 minutes and bound to session, user and organization, exact redirect URI match, `prompt=consent` on first connect. The callback re-verifies the session and membership. Client secrets are Worker secrets; for Microsoft prefer a certificate credential over a client secret (_verify_ WebCrypto signing in the PoC).
- **Webhook secrets** (Graph `clientState`, Google channel `token`) are random per subscription, stored hashed, compared in constant time, and carry no meaning beyond lookup.
- No token, authorization code, `state`, email address or event content appears in logs, traces, error messages or analytics. Provider request IDs and status codes may be logged.

### 4. What may and may not leave TalentStroom

Default content level **"minimal"**; an organization admin may choose **"standard"** after acknowledging a DPIA note. Candidate-identifying content beyond "standard" is not offered.

| Event field          | Minimal (default)                                                                  | Standard (org opt-in)                           |
| -------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| Title                | Appointment type only, localized: "Gesprek (TalentStroom)"                         | Type + candidate **first name** + vacancy title |
| Time, all-day, tz    | Yes (UTC + IANA zone; Graph `Prefer: outlook.timezone="UTC"`)                      | Yes                                             |
| Location / meet link | Yes, as entered by the recruiter (needed to attend)                                | Yes                                             |
| Description          | Only a deep link `https://<app>/agenda/<appointment-id>` (opaque ID, login needed) | Same                                            |
| Attendees            | None: the event is on the user's own calendar only                                 | None                                            |
| Show as / privacy    | Busy; `sensitivity: private` (Graph) / `visibility: private` (Google)              | Same                                            |

Never pushed, at any level: candidate surname, email, phone, address, date of birth, CV or documents, notes, salary, stage or rejection reason, client feedback, assessment results, special-category data, and the appointment's free-text description. TalentStroom never adds candidates or client contacts as provider attendees, because that makes the provider email them and copies their address into the agency's directory; candidate invitations are sent by TalentStroom itself (or later via iMIP) under its own templates. Internal colleagues get the event through their **own** connection, not as attendees.

From the provider we store only: external event ID, change marker (`changeKey`/`etag`), sync/delta token and subscription IDs. In phase C, free/busy blocks are fetched on demand, held in memory for the request (at most a short per-user, per-organization in-memory cache) and never persisted or shown to other users.

### 5. Consent, AVG/GDPR and retention

- **Lawful basis and roles:** processing on the agency's documented instruction; the DPA gets a "calendar integrations" annex (Microsoft/Google are the agency's processors, not our subprocessors, because the data goes to the agency's own tenant). The DPIA screening (epic #452 review) covers the residual risk that a minimal event still reveals that an interview happens at a given time.
- **User consent screen** in TalentStroom before redirecting to the provider: what is written, which scope is requested and why, that Microsoft's permission is broader than what we use, and how to disconnect. Strings via `@talentstroom/i18n`, Dutch first.
- **Retention follows TalentStroom.** When an appointment is deleted or cancelled, when its candidate is erased or reaches the retention limit, or when the application is anonymized, the external event is **deleted** (not edited). Past events in the dedicated calendar are deleted after a configurable window (default 30 days after the appointment) so the third-party copy never outlives TalentStroom's own retention. Erasure requests (privacy_requests) include "external calendar copies" in their completion checklist.
- **Residual copies we cannot reach** (provider backups, eDiscovery holds, devices, a user who copied the event) are documented in the privacy notice; that is why the default content is minimal.

### 6. Revocation and offboarding

| Trigger                                                                                  | Action                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User disconnects                                                                         | Delete subscriptions; delete future events we created (user may choose to keep them); Google: call `revoke`; Microsoft: no per-grant revoke API, so delete our tokens and link to "My Apps" to remove consent; crypto-shred the envelope. |
| Membership removed or suspended, organization deleted                                    | Same, run immediately by the membership change, using the token one last time before shredding it.                                                                                                                                        |
| Provider-side revocation (`invalid_grant`, admin block, password reset, consent removed) | Mark `needs_reconnect`, stop all jobs for the connection, no retry loop, in-app notice without PII. Events already pushed remain (we cannot reach them).                                                                                  |
| Feature flag turned off by org admin                                                     | All connections of that organization disconnected as above.                                                                                                                                                                               |
| Suspected compromise                                                                     | Operator can disable all connections per organization or globally (kill switch), and rotate client secrets/certificates.                                                                                                                  |

### 7. Conflict rules

- TalentStroom is the source of truth for every event it created. Users edit appointments in TalentStroom.
- Phase A: no read-back. A later TalentStroom edit overwrites the external copy.
- Phase B: when our event is moved or deleted externally, TalentStroom shows "Gewijzigd in Outlook/Google" on the appointment with **accept** (apply the new time in TalentStroom, which then follows the normal notification flow) or **restore** (push TalentStroom's version). Nothing is applied automatically, because moving an interview has consequences for the candidate. An externally deleted event is not recreated unless the user restores it.
- Events the user creates manually in the dedicated calendar are ignored (not imported). Events elsewhere in the user's calendar are never read (Google cannot; on Microsoft our code does not).
- Recurring appointments are out of scope (the agenda has none).

### 8. Workers architecture (for the follow-up implementation)

- **Cloudflare Queues** for push jobs (at-least-once, idempotent handlers, DLQ, bounded retries with backoff honouring `Retry-After`); concurrency per connection capped at 2 to stay below Graph's 4-concurrent limit with headroom.
- **Cron Triggers** for token health checks (phase A) and subscription/channel renewal plus a daily delta reconciliation as a safety net for missed notifications (phase B).
- **Webhook endpoint** (phase B only): unauthenticated route, rate-limited, small body limit, answers the Graph validation handshake, verifies `clientState`/channel token, enqueues `{connection_id, hint}` and returns 202 immediately. A notification is only a hint: we always fetch with our own token, so a forged notification can at most cause an extra delta call.
- **Idempotency:** Google event ID derived from the appointment ID; Graph `transactionId` plus our extended property; mapping table unique on `(connection_id, appointment_id)`.
- Bindings change `wrangler.jsonc`; run `wrangler types` (rule 9).

### 9. Failure modes

| Failure                                       | Behaviour                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Provider 429/5xx, network error               | Retry with backoff and `Retry-After`; after N attempts to DLQ; agenda shows "niet gesynchroniseerd" on the item |
| Refresh token invalid/revoked                 | `needs_reconnect` (section 6); no retries                                                                       |
| KMS unavailable                               | Fail closed: sync pauses, jobs retry later; nothing is sent unencrypted or cached                               |
| Lost or expired delta/sync token (Google 410) | Full resync of the dedicated calendar's window (our events only)                                                |
| Missed or forged webhook                      | Daily reconciliation; forged notifications only trigger a verified fetch                                        |
| Subscription expired                          | Cron renews well before expiry; if missed, recreate and reconcile                                               |
| Dedicated calendar deleted by user            | Detected on write (404); mark connection `needs_attention`; offer to recreate                                   |
| Duplicate job delivery                        | Idempotency key and unique mapping; second create is a no-op                                                    |
| Membership revoked while jobs are queued      | Handler re-check fails; job dropped; cleanup job deletes external events                                        |
| Clock or time zone mismatch                   | Store UTC + IANA zone; all-day as date-only; tests across DST changes                                           |

### Measurement plan (PoC, follow-up F2)

Measured against a Microsoft 365 developer tenant and a Google Workspace test domain with synthetic data only:

- p50/p95 latency from TalentStroom save to event visible in Outlook and Google (target p95 < 30 s in phase A).
- Worker CPU and wall time per push job including token refresh and one KMS unwrap (target < 50 ms CPU).
- Webhook delivery latency and missed-notification rate over a week (Graph lists event latency as "unknown").
- Behaviour on refresh-token rotation under concurrent jobs, consent revocation, admin block and Google granular consent.
- Throttling headroom: 100 rapid moves of one appointment must not hit 429.
- ICS refresh interval in Outlook and Google, to confirm the rejection of option 3.

## Consequences

- **Easier:** recruiters see TalentStroom interviews in the calendar they already use; Google access is technically limited to our own calendar; TalentStroom stays the source of truth; the token, consent and tenancy model is reusable for mail (#307).
- **Harder:** two provider integrations to maintain; Google app verification and Microsoft publisher verification; Queues, Cron and (phase B) a public webhook endpoint; a new encrypted record type and tables; retention and erasure now include external copies.
- **Security:** new high-value secrets (OAuth client credentials) and per-user refresh tokens. A compromised Worker with KMS access could use refresh tokens to read Microsoft calendars entirely (broad scope) and Google's dedicated calendar only. Mitigations: envelope encryption, per-organization KEK, decrypt rate limits and alerts (ADR 0008), kill switch, threat-model update before implementation.
- **Privacy:** even minimal events disclose that an interview happens at a time, to the provider and to anyone who can see the user's calendar. Private visibility, generic titles and deletion on retention limit that. The "standard" level is an explicit org decision recorded with a DPIA note.
- **Cost:** provider APIs are free at our volume; Queues and Cron usage is negligible; the main cost is engineering and the verification processes.

## Rollback

Each phase sits behind an organization-level feature flag. Rolling back means: turn the flag off globally, which runs the disconnect path for every connection (delete subscriptions, optionally delete future events we created, revoke Google grants, crypto-shred tokens), then remove the Queue consumer, Cron and webhook route, and drop the connection and mapping tables with an expand/contract migration. Events already pushed and kept by users stay in their calendars; their content is minimal by design. Expected cost: about a day of work plus a notice to connected users. No other data or decision depends on this ADR.

## Open questions for the owner

1. **Custom domain.** Google verification and a trustworthy consent screen need an authorized domain we own; `workers.dev` (ADR 0004) is not enough. Does calendar sync wait for the production domain?
2. **Phase timing.** Epic #452 is Phase 4 (demo first), epic #306 is Phase 10. Is phase A implementation in scope before Phase 10, or does Phase 4 stop at the demo connect/disconnect UI?
3. **Content level.** Is "minimal" acceptable to pilot agencies, and should "standard" (first name + vacancy) be offered at all?
4. **Microsoft breadth.** Accept `Calendars.ReadWrite` (all calendars) with code-level containment, or support only Google until Microsoft offers a narrower scope? (Recommendation: accept, because Microsoft 365 is the larger market.)
5. **Publisher and app verification.** Who owns the Microsoft Partner Network account and the Google Cloud project (the KMS project from ADR 0008 or a separate one)?
6. **Retention window** for past events in the dedicated calendar (default proposed: 30 days).

## Follow-up issues (to be created)

- F1 Threat model and DPIA update for calendar integrations (review:security, review:privacy).
- F2 PoC: Graph and Google push from Workers, with the measurement plan above (synthetic data).
- F3 Schema and migration: `calendar_connections`, `calendar_event_links`, envelope record type `calendar_connection` (requires this ADR accepted).
- F4 Phase A: connect/disconnect flow, push jobs on Queues, org feature flag and content level setting.
- F5 Phase B: webhook endpoint, subscription renewal, drift detection UI.
- F6 Phase C: free/busy overlay.
- F7 DPA annex and privacy-notice text for calendar integrations.
- F8 (Deferred) iMIP invitation fallback for users without Microsoft 365/Google; revisit ICS/CalDAV on demand.
