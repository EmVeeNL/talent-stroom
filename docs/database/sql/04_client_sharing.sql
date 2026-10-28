BEGIN;
CREATE TABLE shortlists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 vacancy_id uuid NOT NULL, created_by_membership_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,vacancy_id) REFERENCES vacancies(organization_id,id),
 FOREIGN KEY(organization_id,created_by_membership_id) REFERENCES memberships(organization_id,id),
 UNIQUE(organization_id,id)
);
CREATE TABLE shortlist_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 shortlist_id uuid NOT NULL, application_id uuid NOT NULL,
 -- Only allowlisted, recruiter-approved fields; sensitive snapshot MUST be encrypted at rest.
 public_alias text, encrypted_snapshot bytea NOT NULL, snapshot_nonce bytea NOT NULL,
 encryption_envelope_id uuid NOT NULL, shared_document_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,shortlist_id) REFERENCES shortlists(organization_id,id),
 FOREIGN KEY(organization_id,application_id) REFERENCES applications(organization_id,id),
 FOREIGN KEY(organization_id,encryption_envelope_id) REFERENCES encryption_key_envelopes(organization_id,id),
 FOREIGN KEY(organization_id,shared_document_id) REFERENCES documents(organization_id,id),
 UNIQUE(organization_id,shortlist_id,application_id), UNIQUE(organization_id,id)
);
-- Ensure application belongs to shortlist vacancy via application-layer transaction validation
-- OR add a deferred constraint trigger. Plain FK cannot express this three-table invariant.
CREATE TABLE share_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 shortlist_id uuid NOT NULL, token_digest bytea NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL, revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,shortlist_id) REFERENCES shortlists(organization_id,id),
 CHECK(expires_at>created_at)
);
CREATE INDEX share_grants_lookup_idx ON share_grants(token_digest) WHERE revoked_at IS NULL;
CREATE TABLE client_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 shortlist_item_id uuid NOT NULL, reviewer_display_name text,
 rating smallint CHECK(rating BETWEEN 1 AND 5),
 decision text CHECK(decision IN ('interested','interview','not_suitable')),
 -- Client feedback can contain PII: encrypted free-text comments, not plaintext.
 comment_ciphertext bytea, comment_nonce bytea, comment_envelope_id uuid,
 submitted_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,shortlist_item_id) REFERENCES shortlist_items(organization_id,id),
 FOREIGN KEY(organization_id,comment_envelope_id) REFERENCES encryption_key_envelopes(organization_id,id)
);
COMMIT;
