import type { IdentityDatabase } from "./identity-db.ts";

export type MembershipRole = IdentityDatabase["app.memberships"]["role"];

/** The signed-in user behind a valid, verified session. */
export interface Principal {
  userId: string;
  sessionId: string;
  authMethod: string | null;
  activeOrganizationId: string | null;
}

/** An active membership in an active organization, read on this request. */
export interface VerifiedMembership {
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
  organizationName: string;
  settings: Record<string, unknown>;
}
