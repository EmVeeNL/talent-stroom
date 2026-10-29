import { z } from "zod";

export const PROBLEM_BASE_URI = "https://talentstroom.dev/problems";

export const PROBLEMS = {
  validationError: {
    type: `${PROBLEM_BASE_URI}/validation-error`,
    status: 422,
    titleKey: "api.problem.validationError",
  },
  payloadTooLarge: {
    type: `${PROBLEM_BASE_URI}/payload-too-large`,
    status: 413,
    titleKey: "api.problem.payloadTooLarge",
  },
  malformedJson: { type: `${PROBLEM_BASE_URI}/malformed-json`, status: 400, titleKey: "api.problem.malformedJson" },
  notFound: { type: `${PROBLEM_BASE_URI}/not-found`, status: 404, titleKey: "api.problem.notFound" },
  tooManyRequests: {
    type: `${PROBLEM_BASE_URI}/too-many-requests`,
    status: 429,
    titleKey: "api.problem.tooManyRequests",
  },
  internalError: { type: `${PROBLEM_BASE_URI}/internal-error`, status: 500, titleKey: "api.problem.internalError" },
} as const;

/** RFC 9457 fields. Omit instance when the request URL could contain personal data. */
export const ProblemDetails = z.object({
  type: z.url(),
  title: z.string(),
  status: z.number().int().min(400).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  requestId: z.string().min(1),
});
export type ProblemDetails = z.infer<typeof ProblemDetails>;

export const ValidationProblem = ProblemDetails.extend({
  type: z.literal(PROBLEMS.validationError.type),
  status: z.literal(PROBLEMS.validationError.status),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).min(1),
});
export type ValidationProblem = z.infer<typeof ValidationProblem>;
