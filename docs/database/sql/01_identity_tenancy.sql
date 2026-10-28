BEGIN;
CREATE TABLE organizations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE,
 name text NOT NULL, locale text NOT NULL DEFAULT 'nl-NL', timezone text NOT NULL DEFAULT 'Europe/Amsterdam',
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','suspended','deleted')),
 settings jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
 display_name text, state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','disabled')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users(lower(email));
CREATE TABLE memberships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 user_id uuid NOT NULL REFERENCES users(id), role text NOT NULL CHECK(role IN ('owner','admin','recruiter','viewer')),
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('invited','active','suspended')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,user_id),
 UNIQUE(organization_id,id)
);
CREATE INDEX memberships_user_idx ON memberships(user_id, state);
CREATE TABLE auth_identities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 provider text NOT NULL, provider_subject text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provider,provider_subject)
);
-- Credential secrets, password hashes, WebAuthn private operations, and MFA factors should
-- reside at a hardened identity provider. This table stores references, NOT raw credentials.
CREATE TABLE auth_security_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
 event_type text NOT NULL, ip_hash text, occurred_at timestamptz NOT NULL DEFAULT now(), metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
COMMIT;
