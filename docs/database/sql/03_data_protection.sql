BEGIN;
-- Keys and plaintext remain outside Neon. Encrypted DEK is wrapped with external KMS KEK.
-- ENCRYPTED PAYLOAD: AEAD AES-256-GCM or XChaCha20-Poly1305; persist nonce and auth tag.
CREATE TABLE encryption_key_envelopes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 subject_type text NOT NULL, subject_id uuid NOT NULL, kms_key_ref text NOT NULL,
 wrapping_version integer NOT NULL, wrapped_dek bytea NOT NULL,
 cipher text NOT NULL DEFAULT 'AES-256-GCM', created_at timestamptz NOT NULL DEFAULT now(),
 rotated_at timestamptz, UNIQUE(organization_id,id), UNIQUE(organization_id,subject_type,subject_id)
);
CREATE TABLE candidate_private (
 candidate_id uuid PRIMARY KEY, organization_id uuid NOT NULL,
 envelope_id uuid NOT NULL, encrypted_payload bytea NOT NULL, nonce bytea NOT NULL,
 payload_schema_version integer NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,candidate_id) REFERENCES candidates(organization_id,id),
 FOREIGN KEY(organization_id,envelope_id) REFERENCES encryption_key_envelopes(organization_id,id),
 UNIQUE(organization_id,candidate_id)
);
-- Store HMAC/blind index outputs, NOT plaintext or reusable hash of low-entropy values.
-- Per-purpose keyed HMAC secret held outside DB; normalize before indexing.
CREATE TABLE candidate_blind_indexes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 candidate_id uuid NOT NULL, field_code text NOT NULL,
 index_version integer NOT NULL, digest bytea NOT NULL,
 FOREIGN KEY(organization_id,candidate_id) REFERENCES candidates(organization_id,id),
 UNIQUE(organization_id,candidate_id,field_code,index_version)
);
CREATE INDEX candidate_blind_lookup_idx ON candidate_blind_indexes(organization_id,field_code,index_version,digest);
CREATE TABLE documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 candidate_id uuid NOT NULL, storage_key text NOT NULL UNIQUE, content_type text NOT NULL,
 byte_size bigint NOT NULL CHECK(byte_size BETWEEN 0 AND 10485760),
 scan_state text NOT NULL DEFAULT 'pending' CHECK(scan_state IN ('pending','clean','blocked','error')),
 encryption_envelope_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,candidate_id) REFERENCES candidates(organization_id,id),
 FOREIGN KEY(organization_id,encryption_envelope_id) REFERENCES encryption_key_envelopes(organization_id,id),
 UNIQUE(organization_id,id)
);
CREATE TABLE retention_policies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 data_category text NOT NULL, review_after_days integer NOT NULL CHECK(review_after_days>0),
 action text NOT NULL CHECK(action IN ('review','delete','anonymize')),
 UNIQUE(organization_id,data_category)
);
CREATE TABLE privacy_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 candidate_id uuid, kind text NOT NULL CHECK(kind IN ('access','export','erase','rectify','restrict')),
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','in_progress','done','denied')),
 requested_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 FOREIGN KEY(organization_id,candidate_id) REFERENCES candidates(organization_id,id)
);
COMMIT;
