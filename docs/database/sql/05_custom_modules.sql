BEGIN;
-- Declarative modules only; NEVER execute customer-provided JS or SQL.
CREATE TABLE module_definitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 slug text NOT NULL, name text NOT NULL, entity_scope text NOT NULL
 CHECK(entity_scope IN ('candidate','vacancy','client','application','standalone')),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','published','archived')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,slug), UNIQUE(organization_id,id)
);
CREATE TABLE module_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 module_id uuid NOT NULL, version integer NOT NULL CHECK(version>0), schema_json jsonb NOT NULL,
 published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,module_id) REFERENCES module_definitions(organization_id,id),
 UNIQUE(organization_id,module_id,version), UNIQUE(organization_id,id)
);
CREATE TABLE module_field_definitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 module_version_id uuid NOT NULL, field_key text NOT NULL,
 field_type text NOT NULL CHECK(field_type IN ('text','number','boolean','date','select','multiselect','reference')),
 is_required boolean NOT NULL DEFAULT false, config jsonb NOT NULL DEFAULT '{}'::jsonb,
 FOREIGN KEY(organization_id,module_version_id) REFERENCES module_versions(organization_id,id),
 UNIQUE(organization_id,module_version_id,field_key), UNIQUE(organization_id,id)
);
CREATE TABLE module_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 module_version_id uuid NOT NULL, linked_entity_type text, linked_entity_id uuid,
 created_by_membership_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,module_version_id) REFERENCES module_versions(organization_id,id),
 FOREIGN KEY(organization_id,created_by_membership_id) REFERENCES memberships(organization_id,id),
 UNIQUE(organization_id,id)
);
CREATE TABLE module_field_values (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 module_record_id uuid NOT NULL, field_id uuid NOT NULL,
 -- Sensitive custom values MUST be encrypted; store ciphertext and avoid plaintext columns.
 ciphertext bytea, nonce bytea, envelope_id uuid,
 non_sensitive_value jsonb,
 FOREIGN KEY(organization_id,module_record_id) REFERENCES module_records(organization_id,id),
 FOREIGN KEY(organization_id,field_id) REFERENCES module_field_definitions(organization_id,id),
 FOREIGN KEY(organization_id,envelope_id) REFERENCES encryption_key_envelopes(organization_id,id),
 UNIQUE(organization_id,module_record_id,field_id),
 CHECK((ciphertext IS NOT NULL AND nonce IS NOT NULL AND envelope_id IS NOT NULL AND non_sensitive_value IS NULL)
 OR (ciphertext IS NULL AND nonce IS NULL AND envelope_id IS NULL AND non_sensitive_value IS NOT NULL))
);
-- Validate that field_id belongs to the record's module_version_id in service/trigger.
-- linked_entity_type/id must be tenant-validated before insert.
COMMIT;
