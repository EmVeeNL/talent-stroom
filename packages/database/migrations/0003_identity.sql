-- 0003_identity: Better Auth identity and organization tables (issue #55; ADR 0006, ADR 0012).
--
-- Placement (ADR 0012):
--   auth  credentials and global identity, only ts_auth (Better Auth + session middleware):
--         users, sessions, auth_accounts, auth_verifications, auth_passkeys, auth_two_factors,
--         auth_rate_limits, auth_security_events
--   app   the tenant root and tenant-scoped identity rows that domain tables reference:
--         organizations, memberships, organization_invitations
--         ts_auth: SELECT, INSERT, UPDATE (no DELETE: members are suspended, organizations
--         change state). ts_app: SELECT on organizations and memberships under tenant RLS,
--         nothing on invitations.
--
-- Column names follow the Better Auth 1.7.12 `modelName`/`fields` mapping in ADR 0012 and
-- docs/architecture/architecture/04-identity-better-auth.md section 5. Ids are uuid
-- (`generateId: "uuid"`); the DB default only serves rows we insert ourselves.
-- Secrets: auth_accounts.password is a scrypt hash, OAuth tokens and TOTP secrets/backup codes
-- are encrypted by Better Auth, verification identifiers are stored hashed
-- (`verification.storeIdentifier: "hashed"`). Session tokens cannot be hashed in 1.7.12;
-- the cookie carries an HMAC signature over them (ADR 0012, consequences).
SET LOCAL ROLE ts_owner;

-- ---------------------------------------------------------------------------------------------
-- app: tenant root
-- ---------------------------------------------------------------------------------------------

CREATE TABLE app.organizations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL,
  logo_url   text,
  metadata   text,  -- Better Auth field, unused by us
  -- Ours: written by our /v1 endpoints, never by Better Auth (DB defaults apply on create).
  locale     text NOT NULL DEFAULT 'nl-NL',
  timezone   text NOT NULL DEFAULT 'Europe/Amsterdam',
  state      text NOT NULL DEFAULT 'active',
  settings   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_unique UNIQUE (slug),
  CONSTRAINT organizations_locale_check CHECK (locale IN ('nl-NL', 'en-GB')),
  CONSTRAINT organizations_state_check CHECK (state IN ('active', 'suspended', 'deleted')),
  CONSTRAINT organizations_settings_check CHECK (jsonb_typeof(settings) = 'object')
);

-- ---------------------------------------------------------------------------------------------
-- auth: global identity and credentials
-- ---------------------------------------------------------------------------------------------

CREATE TABLE auth.users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL,
  email_verified     boolean NOT NULL DEFAULT false,
  display_name       text NOT NULL,
  image_url          text,
  two_factor_enabled boolean NOT NULL DEFAULT false,  -- twoFactor plugin
  platform_role      text,                            -- admin plugin `role`
  banned             boolean NOT NULL DEFAULT false,  -- admin plugin; the platform-level disable
  ban_reason         text,
  ban_expires        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- Only these platform roles exist (ADR 0006 section 8); also rejects comma-separated multi-roles.
  CONSTRAINT users_platform_role_check CHECK (platform_role IN ('user', 'platform-support'))
);
CREATE UNIQUE INDEX users_email_unique ON auth.users (lower(email));

CREATE TABLE auth.sessions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token                  text NOT NULL,
  user_id                uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  expires_at             timestamptz NOT NULL,
  ip_address             text,
  user_agent             text,
  -- organization plugin. Cleared on suspension; no FK action needed because organizations
  -- are never deleted (no DELETE grant), SET NULL is a safety net for break-glass scripts.
  active_organization_id uuid REFERENCES app.organizations (id) ON DELETE SET NULL,
  -- admin plugin column; impersonation is disabled (D12), so it must stay empty.
  impersonated_by        uuid,
  -- Ours (session.additionalFields): idle lock and policy checks (ADR 0006 flows 05, policies).
  auth_method            text,
  last_seen_at           timestamptz,
  locked_at              timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sessions_token_unique UNIQUE (token),  -- per-request lookup by cookie token
  CONSTRAINT sessions_no_impersonation_check CHECK (impersonated_by IS NULL)
);
CREATE INDEX sessions_user_idx ON auth.sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON auth.sessions (expires_at);

-- Replaces the baseline auth_identities. Holds the password hash and (encrypted) OAuth tokens.
CREATE TABLE auth.auth_accounts (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  provider_id              text NOT NULL,
  account_id               text NOT NULL,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  password                 text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_accounts_provider_account_unique UNIQUE (provider_id, account_id)
);
CREATE INDEX auth_accounts_user_idx ON auth.auth_accounts (user_id);

-- Email verification, password reset, OAuth state. `identifier` is a SHA-256 hash
-- (storeIdentifier: "hashed"). Expired rows are purged by a scheduled job.
CREATE TABLE auth.auth_verifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  value      text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_verifications_identifier_idx ON auth.auth_verifications (identifier);
CREATE INDEX auth_verifications_expires_at_idx ON auth.auth_verifications (expires_at);

CREATE TABLE auth.auth_passkeys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name          text,
  public_key    text NOT NULL,
  credential_id text NOT NULL,
  counter       integer NOT NULL,
  device_type   text NOT NULL,
  backed_up     boolean NOT NULL,
  transports    text,
  aaguid        text,
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT auth_passkeys_credential_unique UNIQUE (credential_id),
  CONSTRAINT auth_passkeys_counter_check CHECK (counter >= 0)
);
CREATE INDEX auth_passkeys_user_idx ON auth.auth_passkeys (user_id);

-- `secret` and `backup_codes` are encrypted by Better Auth (storeBackupCodes: "encrypted").
CREATE TABLE auth.auth_two_factors (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  secret                    text NOT NULL,
  backup_codes              text NOT NULL,
  verified                  boolean NOT NULL DEFAULT true,
  failed_verification_count integer NOT NULL DEFAULT 0,
  locked_until              timestamptz
);
CREATE INDEX auth_two_factors_user_idx ON auth.auth_two_factors (user_id);

-- Better Auth rate limiter with database storage. `last_request` is epoch milliseconds.
CREATE TABLE auth.auth_rate_limits (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL,
  count        integer NOT NULL,
  last_request bigint NOT NULL,
  CONSTRAINT auth_rate_limits_key_unique UNIQUE (key)
);

-- ---------------------------------------------------------------------------------------------
-- app: tenant-scoped identity rows
-- ---------------------------------------------------------------------------------------------

-- Domain tables reference people as (organization_id, membership_id) → memberships(organization_id, id).
-- Rows are never deleted (history); removal sets state = 'suspended'.
CREATE TABLE app.memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app.organizations (id) ON DELETE RESTRICT,
  user_id         uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  role            text NOT NULL,
  state           text NOT NULL DEFAULT 'active',  -- ours, schema.member.additionalFields
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- Also the per-request lookup (active_organization_id, user_id).
  CONSTRAINT memberships_organization_user_unique UNIQUE (organization_id, user_id),
  CONSTRAINT memberships_organization_id_unique UNIQUE (organization_id, id),
  -- Single role only: rejects Better Auth's default "member" and comma-separated multi-roles.
  CONSTRAINT memberships_role_check CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
  CONSTRAINT memberships_state_check CHECK (state IN ('active', 'suspended'))
);
-- "List my organizations" (Kies je organisatie).
CREATE INDEX memberships_user_idx ON app.memberships (user_id, state);

-- The invitation id is the link token; acceptance also requires a signed-in user whose
-- verified email matches `email` (requireEmailVerificationOnInvitation).
CREATE TABLE app.organization_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app.organizations (id) ON DELETE RESTRICT,
  email           text NOT NULL,
  role            text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  expires_at      timestamptz NOT NULL,
  inviter_id      uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_invitations_organization_id_unique UNIQUE (organization_id, id),
  CONSTRAINT organization_invitations_role_check CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
  CONSTRAINT organization_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled'))
);
CREATE INDEX organization_invitations_organization_idx ON app.organization_invitations (organization_id, status);
CREATE INDEX organization_invitations_email_idx ON app.organization_invitations (lower(email));

-- ---------------------------------------------------------------------------------------------
-- auth: security events (ours, append-only, written from Better Auth hooks)
-- ---------------------------------------------------------------------------------------------

CREATE TABLE auth.auth_security_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  organization_id uuid REFERENCES app.organizations (id) ON DELETE RESTRICT,  -- NULL: not tenant-bound
  event_type      text NOT NULL,
  ip_hash         text,  -- keyed hash, never the raw IP
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT auth_security_events_type_check CHECK (event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$'),
  CONSTRAINT auth_security_events_metadata_check CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX auth_security_events_user_idx ON auth.auth_security_events (user_id, occurred_at);
CREATE INDEX auth_security_events_organization_idx ON auth.auth_security_events (organization_id, occurred_at);

-- ---------------------------------------------------------------------------------------------
-- Grants. Default privileges (0001) gave ts_auth DML on every auth table and ts_app DML on
-- every app table; narrow them to the ADR 0012 matrix.
-- ---------------------------------------------------------------------------------------------

-- Security events are append-only, also for Better Auth.
REVOKE UPDATE, DELETE ON auth.auth_security_events FROM ts_auth;

-- ts_auth reaches app only for these three tables, and cannot delete from them.
GRANT USAGE ON SCHEMA app TO ts_auth;
GRANT SELECT, INSERT, UPDATE ON app.organizations, app.memberships, app.organization_invitations TO ts_auth;

-- ts_app reads the tenant root and memberships (tenant checks, joins, composite FKs);
-- identity writes go through ts_auth. Invitations (email addresses) stay with ts_auth.
REVOKE INSERT, UPDATE, DELETE ON app.organizations, app.memberships FROM ts_app;
REVOKE ALL ON app.organization_invitations FROM ts_app;

-- ---------------------------------------------------------------------------------------------
-- Row-level security. ENABLE + FORCE everywhere, so even a mistaken grant exposes nothing:
-- a role without a policy sees no rows.
-- ---------------------------------------------------------------------------------------------

-- auth tables: only ts_auth has a policy. users and sessions are global (a person signs in
-- before choosing an organization and may belong to several), so they are not tenant-scoped.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'sessions', 'auth_accounts', 'auth_verifications', 'auth_passkeys',
    'auth_two_factors', 'auth_rate_limits'
  ] LOOP
    EXECUTE format('ALTER TABLE auth.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE auth.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY auth_service ON auth.%I FOR ALL TO ts_auth USING (true) WITH CHECK (true)', t);
  END LOOP;
END
$$;

ALTER TABLE auth.auth_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.auth_security_events FORCE ROW LEVEL SECURITY;
CREATE POLICY auth_service_read ON auth.auth_security_events FOR SELECT TO ts_auth USING (true);
CREATE POLICY auth_service_append ON auth.auth_security_events FOR INSERT TO ts_auth WITH CHECK (true);

-- app identity tables: ts_auth works across organizations (listing a user's organizations,
-- invitations, sign-in binding); ts_app sees only the organization in its transaction context.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations', 'memberships', 'organization_invitations'] LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE app.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY auth_service ON app.%I FOR ALL TO ts_auth USING (true) WITH CHECK (true)', t);
  END LOOP;
END
$$;

CREATE POLICY tenant_scope ON app.organizations FOR SELECT TO ts_app
  USING (id = app.current_organization_id());
CREATE POLICY tenant_scope ON app.memberships FOR SELECT TO ts_app
  USING (organization_id = app.current_organization_id());
-- organization_invitations: deliberately no ts_app policy (no grant either).

COMMENT ON TABLE app.organizations IS 'Tenant root. Better Auth organization model; locale/timezone/state/settings are ours.';
COMMENT ON TABLE app.memberships IS 'Better Auth member model. Never deleted: suspended. Target of (organization_id, membership_id) FKs.';
COMMENT ON TABLE app.organization_invitations IS 'Better Auth invitation model. ts_auth only.';
COMMENT ON TABLE auth.sessions IS 'Better Auth sessions. Global per user, not tenant-scoped; active_organization_id is the chosen tenant.';
COMMENT ON TABLE auth.auth_security_events IS 'Append-only security events from Better Auth hooks.';
