BEGIN;
CREATE TABLE clients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 name text NOT NULL, website text, industry text, status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,id)
);
CREATE INDEX clients_name_idx ON clients(organization_id,name);
CREATE TABLE client_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 client_id uuid NOT NULL, display_name text NOT NULL, email text, phone text,
 title text, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,client_id) REFERENCES clients(organization_id,id), UNIQUE(organization_id,id)
);
CREATE TABLE vacancies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 client_id uuid NOT NULL, title text NOT NULL, description text,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','open','paused','filled','closed')),
 location text, salary_currency char(3), salary_min numeric(12,2), salary_max numeric(12,2),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,client_id) REFERENCES clients(organization_id,id), UNIQUE(organization_id,id),
 CHECK(salary_min IS NULL OR salary_min>=0), CHECK(salary_max IS NULL OR salary_max>=0),
 CHECK(salary_min IS NULL OR salary_max IS NULL OR salary_max>=salary_min)
);
CREATE INDEX vacancies_org_status_idx ON vacancies(organization_id,status);
-- Candidates are workspace-specific: the same person at two agencies is two records.
-- Keep sensitive fields in candidate_private, never in this metadata table.
CREATE TABLE candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 owner_membership_id uuid, source text, status text NOT NULL DEFAULT 'active'
 CHECK(status IN ('active','archived','deletion_pending')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
 FOREIGN KEY(organization_id,owner_membership_id) REFERENCES memberships(organization_id,id),
 UNIQUE(organization_id,id)
);
CREATE TABLE pipeline_stages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id),
 code text NOT NULL, label_nl text NOT NULL, sort_order integer NOT NULL,
 terminal_kind text CHECK(terminal_kind IN ('hired','rejected') OR terminal_kind IS NULL),
 UNIQUE(organization_id,code), UNIQUE(organization_id,id)
);
CREATE TABLE applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 candidate_id uuid NOT NULL, vacancy_id uuid NOT NULL, stage_id uuid NOT NULL,
 owner_membership_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,candidate_id) REFERENCES candidates(organization_id,id),
 FOREIGN KEY(organization_id,vacancy_id) REFERENCES vacancies(organization_id,id),
 FOREIGN KEY(organization_id,stage_id) REFERENCES pipeline_stages(organization_id,id),
 FOREIGN KEY(organization_id,owner_membership_id) REFERENCES memberships(organization_id,id),
 UNIQUE(organization_id,candidate_id,vacancy_id), UNIQUE(organization_id,id)
);
CREATE INDEX applications_pipeline_idx ON applications(organization_id,vacancy_id,stage_id);
CREATE TABLE application_stage_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 application_id uuid NOT NULL, from_stage_id uuid, to_stage_id uuid NOT NULL,
 actor_membership_id uuid, occurred_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,application_id) REFERENCES applications(organization_id,id),
 FOREIGN KEY(organization_id,from_stage_id) REFERENCES pipeline_stages(organization_id,id),
 FOREIGN KEY(organization_id,to_stage_id) REFERENCES pipeline_stages(organization_id,id),
 FOREIGN KEY(organization_id,actor_membership_id) REFERENCES memberships(organization_id,id)
);
CREATE TABLE placements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 application_id uuid NOT NULL, placed_on date NOT NULL, fee_amount numeric(12,2), fee_currency char(3),
 state text NOT NULL DEFAULT 'confirmed' CHECK(state IN ('confirmed','reversed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,application_id) REFERENCES applications(organization_id,id),
 UNIQUE(organization_id,application_id), CHECK(fee_amount IS NULL OR fee_amount>=0)
);
COMMIT;
