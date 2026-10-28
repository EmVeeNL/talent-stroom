-- Illustrative baseline; REQUIRES application-role privilege model and security testing.
-- Do not grant table access to anon/public portal runtime. A dedicated service validates share tokens.
BEGIN;
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY[
 'memberships','clients','client_contacts','vacancies','candidates','pipeline_stages',
 'applications','application_stage_events','placements','encryption_key_envelopes',
 'candidate_private','candidate_blind_indexes','documents','retention_policies','privacy_requests',
 'shortlists','shortlist_items','share_grants','client_feedback','module_definitions',
 'module_versions','module_field_definitions','module_records','module_field_values',
 'tasks','ai_jobs','translations','outbox_events','audit_events']) LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (organization_id = app.current_organization_id()) WITH CHECK (organization_id = app.current_organization_id())', 'tenant_scope_'||t,t);
 END LOOP;
END $$;
-- Users, organizations, identities, and auth events require a DIFFERENT identity/bootstrap
-- policy design. Never expose them through broad tenant policies without membership verification.
COMMIT;
