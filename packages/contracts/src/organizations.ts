import { z } from "zod";

/** Organization roles (ADR 0006). Enforced by a CHECK constraint on app.memberships. */
export const MembershipRole = z.enum(["owner", "admin", "recruiter", "viewer"]);
export type MembershipRole = z.infer<typeof MembershipRole>;

/** One active membership of the signed-in user ("Kies je organisatie"). */
export const OrganizationMembership = z.object({
  organizationId: z.uuid(),
  membershipId: z.uuid(),
  name: z.string(),
  slug: z.string(),
  role: MembershipRole,
});
export type OrganizationMembership = z.infer<typeof OrganizationMembership>;

/** Response of `GET /v1/me/organizations`. Only active memberships of active organizations. */
export const MyOrganizationsResponse = z.object({
  /** The session's active organization, or null when none is chosen yet. */
  activeOrganizationId: z.uuid().nullable(),
  organizations: z.array(OrganizationMembership),
});
export type MyOrganizationsResponse = z.infer<typeof MyOrganizationsResponse>;

/** Request of `POST /v1/organizations`. The slug is derived server-side. */
export const CreateOrganizationRequest = z.object({
  name: z.string().trim().min(2).max(100),
});
export type CreateOrganizationRequest = z.infer<typeof CreateOrganizationRequest>;

/**
 * The verified organization context of the current session. Returned after creating or
 * switching an organization (both rotate the session cookie) and by
 * `GET /v1/organizations/current`. Clients must drop all cached data of any other
 * organization when `organizationId` changes.
 */
export const OrganizationContext = z.object({
  organizationId: z.uuid(),
  membershipId: z.uuid(),
  name: z.string(),
  role: MembershipRole,
});
export type OrganizationContext = z.infer<typeof OrganizationContext>;

export const OrganizationIdParam = z.object({ orgId: z.uuid() });
