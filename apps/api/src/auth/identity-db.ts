import type { Generated } from "kysely";

/** Columns of the identity tables that our own code reads or writes as ts_auth (0003). */
export interface IdentityDatabase {
  "auth.users": {
    id: string;
    email: string;
    email_verified: boolean;
    banned: boolean | null;
  };
  "app.organization_invitations": {
    id: string;
    organization_id: string;
    email: string;
    role: IdentityDatabase["app.memberships"]["role"];
    status: "pending" | "accepted" | "rejected" | "canceled";
    expires_at: Date;
  };
  "app.organizations": {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown>;
    state: "active" | "suspended" | "deleted";
  };
  "app.memberships": {
    id: string;
    organization_id: string;
    user_id: string;
    role: "owner" | "admin" | "recruiter" | "viewer";
    state: "active" | "suspended";
    updated_at: Generated<Date>;
  };
  "auth.sessions": {
    id: string;
    token: string;
    user_id: string;
    active_organization_id: string | null;
  };
  "auth.auth_security_events": {
    id: Generated<string>;
    user_id: string | null;
    organization_id: string | null;
    event_type: string;
    occurred_at: Generated<Date>;
    metadata: Generated<Record<string, unknown>>;
  };
}
