import type { Kysely } from "kysely";
import type { IdentityDatabase } from "./identity-db.ts";
import type { VerifiedMembership } from "./types.ts";

type Acceptance =
  | { membership: VerifiedMembership }
  | { error: "notFound" | "forbidden" | "invitationExpired" | "invitationConflict" };

/** Identity writes as ts_auth (ADR 0012). Rotation runs after this transaction commits. */
export async function acceptInvitation(
  db: Kysely<IdentityDatabase>,
  userId: string,
  invitationId: string,
): Promise<Acceptance> {
  return db.transaction().execute(async (trx): Promise<Acceptance> => {
    // Serialize acceptance/cancellation of this invitation, including concurrent retries.
    const invitation = await trx
      .selectFrom("app.organization_invitations")
      .selectAll()
      .where("id", "=", invitationId)
      .forUpdate()
      .executeTakeFirst();
    const user = await trx
      .selectFrom("auth.users")
      .select(["email", "email_verified", "banned"])
      .where("id", "=", userId)
      .forShare()
      .executeTakeFirst();
    if (!user?.email_verified || user.banned) return { error: "forbidden" };
    // Check the recipient before revealing any invitation state.
    if (!invitation || invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return { error: "notFound" };
    }
    if (invitation.status !== "pending") return { error: "invitationConflict" };
    // Hold organization state stable until membership and event are committed.
    const organization = await trx
      .selectFrom("app.organizations")
      .select(["id", "name", "state", "settings"])
      .where("id", "=", invitation.organization_id)
      .forShare()
      .executeTakeFirst();
    if (organization?.state !== "active") return { error: "forbidden" };
    if (invitation.expires_at.getTime() <= Date.now()) return { error: "invitationExpired" };

    // A suspended membership must never be revived by an invitation. The unique key also
    // handles different invitations for the same recipient accepted concurrently.
    const member = await trx
      .insertInto("app.memberships")
      .values({
        id: crypto.randomUUID(),
        organization_id: organization.id,
        user_id: userId,
        role: invitation.role,
        state: "active",
      })
      .onConflict((oc) => oc.columns(["organization_id", "user_id"]).doNothing())
      .returning("id")
      .executeTakeFirst();
    if (!member) return { error: "invitationConflict" };
    await trx
      .updateTable("app.organization_invitations")
      .set({ status: "accepted" })
      .where("id", "=", invitationId)
      .execute();
    await trx
      .insertInto("auth.auth_security_events")
      .values({
        user_id: userId,
        organization_id: organization.id,
        event_type: "invitation.accepted",
      })
      .execute();
    return {
      membership: {
        organizationId: organization.id,
        organizationName: organization.name,
        settings: organization.settings,
        membershipId: member.id,
        role: invitation.role,
      },
    };
  });
}
