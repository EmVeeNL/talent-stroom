-- TalentStroom PostgreSQL / Neon foundation
-- Execute as migration owner; runtime should use a separate least-privileged role.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.current_organization_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.organization_id', true), '')::uuid $$;
-- This setting is NOT authentication. Only trusted backend code may set it, in a transaction,
-- AFTER verifying user membership; never expose direct SQL access to untrusted clients.
COMMIT;
