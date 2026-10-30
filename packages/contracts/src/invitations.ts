import { z } from "zod";

/** Path parameter for accepting an invitation. The signed-in verified email must match. */
export const InvitationIdParam = z.object({ invitationId: z.uuid() });
