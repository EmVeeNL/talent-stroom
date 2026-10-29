-- 0001_roles: roles, schemas and default privileges (issue #54, ADR 0007 section 5).
--
-- Runs as the migrator: locally the container superuser, on Neon the SQL-created
-- `ts_migrator` login (CREATEROLE + CREATE on the database, see packages/database/README.md).
-- No passwords here (public repository): login roles get theirs out of band.
-- Roles are cluster-wide and a Neon branch copies its parent's roles, so every role step
-- tolerates an existing role, but fails closed if that role has unsafe attributes.
-- Only features available to non-superusers on Neon are used (no ALTER SYSTEM).

-- Owner of all schemas and objects. Nobody logs in as it; the migrator uses SET ROLE.
DO $$
DECLARE
  existing pg_roles%ROWTYPE;
BEGIN
  SELECT * INTO existing FROM pg_roles WHERE rolname = 'ts_owner';
  IF NOT FOUND THEN
    CREATE ROLE ts_owner NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION NOINHERIT;
  ELSIF existing.rolcanlogin OR existing.rolsuper OR existing.rolbypassrls THEN
    RAISE EXCEPTION 'role ts_owner exists with unsafe attributes (LOGIN, SUPERUSER or BYPASSRLS)';
  END IF;
END
$$;

-- Runtime logins: ts_app (API Worker via Hyperdrive) and ts_auth (Better Auth via
-- HYPERDRIVE_AUTH, ADR 0006). Least privilege: no superuser, no RLS bypass, no role or
-- database creation, no inherited memberships.
DO $$
DECLARE
  role_name text;
  existing pg_roles%ROWTYPE;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['ts_app', 'ts_auth'] LOOP
    SELECT * INTO existing FROM pg_roles WHERE rolname = role_name;
    IF NOT FOUND THEN
      EXECUTE format(
        'CREATE ROLE %I LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOREPLICATION NOINHERIT',
        role_name
      );
    ELSIF existing.rolsuper OR existing.rolbypassrls OR existing.rolcreaterole
      OR existing.rolcreatedb OR existing.rolreplication OR existing.rolinherit
      OR NOT existing.rolcanlogin THEN
      -- E.g. created through the Neon Console, which adds neon_superuser and BYPASSRLS.
      RAISE EXCEPTION 'role % exists with unsafe attributes; drop it and let this migration create it', role_name;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid = m.member WHERE r.rolname = role_name
    ) THEN
      RAISE EXCEPTION 'role % must not be a member of any role (e.g. neon_superuser)', role_name;
    END IF;
  END LOOP;
END
$$;

-- The migrator must be able to SET ROLE ts_owner so that objects end up owned by ts_owner.
-- A superuser already can; ts_migrator on Neon created ts_owner and therefore holds ADMIN on it.
DO $$
BEGIN
  IF NOT pg_has_role(current_user, 'ts_owner', 'SET') THEN
    EXECUTE format('GRANT ts_owner TO %I WITH INHERIT FALSE, SET TRUE', current_user);
  END IF;
END
$$;

-- Schemas. Created by the migrator (which has CREATE on the database) on behalf of ts_owner.
CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION ts_owner;
CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION ts_owner;
ALTER SCHEMA app OWNER TO ts_owner;
ALTER SCHEMA auth OWNER TO ts_owner;

-- Grants and default privileges are issued as ts_owner, so they apply to every object that
-- later migrations create after `SET LOCAL ROLE ts_owner`.
SET LOCAL ROLE ts_owner;

REVOKE ALL ON SCHEMA app FROM PUBLIC;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;

-- app: DML only for ts_app (no TRUNCATE, REFERENCES, TRIGGER, no DDL). ts_auth gets nothing.
GRANT USAGE ON SCHEMA app TO ts_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ts_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT USAGE, SELECT ON SEQUENCES TO ts_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT EXECUTE ON FUNCTIONS TO ts_app;

-- auth: DML only for ts_auth. ts_app gets nothing here (credential tables, ADR 0006).
GRANT USAGE ON SCHEMA auth TO ts_auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ts_auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT USAGE, SELECT ON SEQUENCES TO ts_auth;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT EXECUTE ON FUNCTIONS TO ts_auth;

-- Functions are executable by PUBLIC by default; only the grants above apply instead.
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

RESET ROLE;

-- Sticky per-role limits (Hyperdrive resets session SET, ADR 0007 section 3).
-- Hyperdrive caps queries at 60 s; transactions must stay short.
ALTER ROLE ts_app SET statement_timeout = '15s';
ALTER ROLE ts_app SET lock_timeout = '5s';
ALTER ROLE ts_app SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE ts_auth SET statement_timeout = '15s';
ALTER ROLE ts_auth SET lock_timeout = '5s';
ALTER ROLE ts_auth SET idle_in_transaction_session_timeout = '15s';
