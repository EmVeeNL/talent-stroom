import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements as platformStatements } from "better-auth/plugins/admin/access";
import { defaultStatements as organizationStatements } from "better-auth/plugins/organization/access";

// Organization roles (ADR 0006): owner/admin/recruiter/viewer. Teams and organization
// deletion are not used; members are suspended through our /v1 API, never deleted.
export const organizationAc = createAccessControl({
  organization: organizationStatements.organization,
  member: organizationStatements.member,
  invitation: organizationStatements.invitation,
});

export const organizationRoles = {
  owner: organizationAc.newRole({
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
  }),
  admin: organizationAc.newRole({
    organization: ["update"],
    member: ["create", "update", "delete"],
    invitation: ["create", "cancel"],
  }),
  // Domain permissions for recruiters and viewers live in our /v1 handlers.
  recruiter: organizationAc.newRole({ organization: [], member: [], invitation: [] }),
  viewer: organizationAc.newRole({ organization: [], member: [], invitation: [] }),
};

// Platform roles (admin plugin), D12 / owner decision 3: operators can ban and revoke
// sessions only. No impersonation, set-password, user CRUD or role changes.
export const platformAc = createAccessControl({
  user: platformStatements.user,
  session: platformStatements.session,
});

export const platformRoles = {
  user: platformAc.newRole({ user: [], session: [] }),
  "platform-support": platformAc.newRole({ user: ["ban"], session: ["revoke"] }),
};
