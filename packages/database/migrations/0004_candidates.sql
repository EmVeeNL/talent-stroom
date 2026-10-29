-- Candidate storage: ADR 0011 (whole envelope), ADR 0007 and ADR 0012.
SET LOCAL ROLE ts_owner;

CREATE TABLE app.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES app.organizations (id),
  owner_membership_id uuid,
  source text, -- Controlled source code only; never names, URLs or other personal data.
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deletion_pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  FOREIGN KEY (organization_id, owner_membership_id) REFERENCES app.memberships (organization_id, id),
  UNIQUE (organization_id, id)
);

CREATE TABLE app.candidate_private (
  candidate_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  envelope bytea NOT NULL CHECK (get_byte(envelope, 0) = 1),
  payload_schema_version integer NOT NULL DEFAULT 1 CHECK (payload_schema_version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id, candidate_id) REFERENCES app.candidates (organization_id, id)
);

CREATE TABLE app.candidate_blind_indexes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  field_code text NOT NULL CHECK (field_code IN ('email', 'phone')),
  index_version integer NOT NULL CHECK (index_version > 0),
  digest bytea NOT NULL CHECK (octet_length(digest) = 32),
  FOREIGN KEY (organization_id, candidate_id) REFERENCES app.candidates (organization_id, id),
  UNIQUE (organization_id, candidate_id, field_code, index_version)
);
CREATE INDEX candidate_blind_lookup_idx
  ON app.candidate_blind_indexes (organization_id, field_code, index_version, digest);

-- Default privileges grant ts_app DML, and grant nothing to ts_auth.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['candidates', 'candidate_private', 'candidate_blind_indexes'] LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE app.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY tenant_scope ON app.%I FOR ALL TO ts_app
      USING (organization_id = app.current_organization_id())
      WITH CHECK (organization_id = app.current_organization_id())', t);
  END LOOP;
END
$$;
