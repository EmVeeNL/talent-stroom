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
  unauthorized: { type: `${PROBLEM_BASE_URI}/unauthorized`, status: 401, titleKey: "api.problem.unauthorized" },
  forbidden: { type: `${PROBLEM_BASE_URI}/forbidden`, status: 403, titleKey: "api.problem.forbidden" },
  mfaRequired: { type: `${PROBLEM_BASE_URI}/mfa-required`, status: 403, titleKey: "api.problem.mfaRequired" },
  organizationMismatch: {
    type: `${PROBLEM_BASE_URI}/organization-mismatch`,
    status: 409,
    titleKey: "api.problem.organizationMismatch",
  },
  invitationExpired: {
    type: `${PROBLEM_BASE_URI}/invitation-expired`,
    status: 410,
    titleKey: "api.problem.invitationExpired",
  },
  invitationConflict: {
    type: `${PROBLEM_BASE_URI}/invitation-conflict`,
    status: 409,
    titleKey: "api.problem.invitationConflict",
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
