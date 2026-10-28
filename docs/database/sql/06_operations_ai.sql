BEGIN;
CREATE TABLE tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 assignee_membership_id uuid, title text NOT NULL, due_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','done','cancelled')),
 entity_type text, entity_id uuid, source_event_key text,
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 FOREIGN KEY(organization_id,assignee_membership_id) REFERENCES memberships(organization_id,id),
 UNIQUE(organization_id,source_event_key)
);
CREATE INDEX tasks_due_idx ON tasks(organization_id,assignee_membership_id,due_at) WHERE state='open';
CREATE TABLE ai_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 requested_by_membership_id uuid, purpose text NOT NULL
 CHECK(purpose IN ('cv_parse','translation','writing_assist','summary')),
 provider text, model_identifier text, state text NOT NULL DEFAULT 'queued'
 CHECK(state IN ('queued','running','review','completed','failed','cancelled')),
 input_document_id uuid, result_storage_key text, error_code text,
 created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 FOREIGN KEY(organization_id,requested_by_membership_id) REFERENCES memberships(organization_id,id),
 FOREIGN KEY(organization_id,input_document_id) REFERENCES documents(organization_id,id),
 UNIQUE(organization_id,id)
);
CREATE INDEX ai_jobs_state_idx ON ai_jobs(organization_id,state,created_at);
CREATE TABLE translations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 ai_job_id uuid, target_entity_type text NOT NULL, target_entity_id uuid NOT NULL,
 source_locale text NOT NULL, target_locale text NOT NULL,
 encrypted_text bytea NOT NULL, nonce bytea NOT NULL, envelope_id uuid NOT NULL,
 approval_state text NOT NULL DEFAULT 'draft' CHECK(approval_state IN ('draft','approved','rejected')),
 approved_by_membership_id uuid, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,ai_job_id) REFERENCES ai_jobs(organization_id,id),
 FOREIGN KEY(organization_id,envelope_id) REFERENCES encryption_key_envelopes(organization_id,id),
 FOREIGN KEY(organization_id,approved_by_membership_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE outbox_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 topic text NOT NULL, event_key text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz,
 UNIQUE(organization_id,event_key)
);
CREATE INDEX outbox_pending_idx ON outbox_events(created_at) WHERE delivered_at IS NULL;
CREATE TABLE audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 actor_membership_id uuid, action text NOT NULL, object_type text, object_id uuid,
 occurred_at timestamptz NOT NULL DEFAULT now(), metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 FOREIGN KEY(organization_id,actor_membership_id) REFERENCES memberships(organization_id,id)
);
CREATE INDEX audit_events_time_idx ON audit_events(organization_id,occurred_at DESC);
COMMIT;
