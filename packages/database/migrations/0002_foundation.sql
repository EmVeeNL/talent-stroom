-- 0002_foundation: tenant-context helper (docs/database/sql/00_foundation.sql, ADR 0007 section 3).
--
-- No pgcrypto: UUID generation (gen_random_uuid, uuidv7) is built into Postgres 18 and
-- encryption happens in the application layer, never in the database.
SET LOCAL ROLE ts_owner;

-- Returns the organization set with set_config('app.organization_id', $1, true) inside the
-- current transaction, or NULL when unset. NULL makes `organization_id = ...` match nothing,
-- so RLS fails closed. This setting is NOT authentication: only trusted backend code sets it,
-- after verifying membership (withTenant, #56).
CREATE OR REPLACE FUNCTION app.current_organization_id() RETURNS uuid
  LANGUAGE sql
  STABLE
  PARALLEL SAFE
AS $$
  SELECT NULLIF(pg_catalog.current_setting('app.organization_id', true), '')::uuid
$$;

COMMENT ON FUNCTION app.current_organization_id() IS
  'Tenant from transaction-local setting app.organization_id; NULL (fail closed) when unset.';
