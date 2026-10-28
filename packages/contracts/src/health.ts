import { z } from "zod";

/** Response of `GET /health`. Contains no tenant or personal data. */
export const HealthResponse = z.object({
  status: z.literal("ok"),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponse>;
