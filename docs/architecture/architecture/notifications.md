# In-app notification centre (#456)

## Demo implementation

The shell bell opens the existing accessible Sheet; preferences open the existing Dialog.
The profile menu's Settings entry opens the same preferences. Five notification types are
represented: upcoming appointment, new message, task due, mention and status change.
The badge counts unread, enabled, currently eligible items. Each item can be marked read;
“mark all” covers all currently eligible items. Opening a destination marks that item read.
Read items remain visible with a read label. Type preferences apply immediately and hide
disabled types from both the list and count. Appointment reminders support 5/15/30/60
minutes (default 15); expired appointments leave the list. The demonstration starts with
five items, an appointment ten minutes away, and adds a second message after a minute.
A polite, atomic live region announces new eligible items even while the sheet is closed.

All notification copy is translated from Dutch keys, including the synthetic fixture text.
Destinations are fixed existing demo pages, with no names, identifiers, query or hash data.
These are page-level links: selecting an individual record awaits the real API integration.
Demo items only load when demo pages are enabled; production shows an explicit disconnected
service state. No real candidate, colleague, appointment or message data is read.

State is memory-only, survives client-side page navigation, and resets on reload or an
organization/user remount. Preferences are deliberately session-only until a server-backed
profile exists. Nothing is written to browser storage, URLs, logs, analytics or queues.
The existing dialogs manage focus trapping, Escape and backdrop behavior; the caller
restores focus to the bell or profile trigger. No new animation is introduced, so reduced
motion uses the existing shared components' behavior. The bell remains available on mobile.

## Draft API contract (not implemented)

This draft does **not** authorize changes to authentication, membership checks, tenant
scoping or migrations. Those need an accepted ADR and security review before implementation.
No endpoint, persistence, push subscription or background job is added by #456.

All endpoints below require an authenticated session and server-verified membership of the
active organization. The recipient is always the session user, never a client-supplied user
ID. Check scope on every read and mutation; a guessed item ID must return the same generic
not-found response as an absent item. Do not trust an organization header alone.

| Operation | Proposed endpoint | Request / response |
| --- | --- | --- |
| List | `GET /v1/notifications` | Cursor pagination: `{ items, nextCursor, unreadCount }`; newest first |
| Mark one read | `PATCH /v1/notifications/{notificationId}` | `{ read: true }`; idempotent, return 204 |
| Mark all read | `POST /v1/notifications/read-all` | `{ through: opaqueSnapshotToken }`; 204; items arriving after the list snapshot remain unread |
| Get preferences | `GET /v1/me/notification-preferences` | `{ appointment, message, task, mention, status, appointmentLeadMinutes }` |
| Update preferences | `PUT /v1/me/notification-preferences` | Complete same shape, booleans and lead enum `5 | 15 | 30 | 60`; return validated shape |

Proposed item: `{ id, type, createdAt, readAt, destination, startsAt? }`. IDs and cursors
must be opaque random values without personal data. `type` is one of `appointment`,
`message`, `task`, `mention`, `status`; `destination` is an allowlisted resource kind
and opaque resource ID, never an arbitrary URL. Render generic translated content by type;
do not put names or message bodies in notification/job payloads. For private appointments,
only the authorized recipient may receive the reminder. Delivery must deduplicate per
recipient/event and apply the saved lead time and type preferences server-side.

The server must recheck access to the destination on navigation, including after a role
change or deletion. Use private/no-store responses, no shared caching, and no request-body
or notification-URL logging. Validation errors must be generic and contain no submitted
values. Read timestamps and preferences are scoped to the current recipient/organization.
The eventual API must define retention, pagination bounds, snapshot tokens and membership
revocation behavior before implementation. Polling/live delivery and durable preferences
are intentionally deferred; the UI currently uses a synthetic timer only.

## Verification

`apps/web/src/notifications.test.tsx` covers all five types, read actions, safe destinations,
preferences, lead-time filtering, live announcements, focus restoration, keyboard opening,
axe checks, scope remount and production's empty state. Run the full `pnpm check` before
handoff. Shared Sheet/Dialog/Popover implementations are untouched, avoiding #459 overlap.
`apps/web/visual/notifications.visual.ts` adds real-browser checks at desktop and mobile
sizes for native focus trapping, Escape, reduced motion, profile settings and navigation.
The implementation environment blocked Chromium at launch (Mach port permission denied),
so these browser checks and visual captures still need a run outside that sandbox.
