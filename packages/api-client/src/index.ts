import createClient from "openapi-fetch";
import type { components, paths } from "./schema.gen.ts";

export type { components } from "./schema.gen.ts";
export type ProblemDetails = components["schemas"]["ProblemDetails"];
export type ValidationProblem = components["schemas"]["ValidationProblem"];

export function createApiClient({ baseUrl = "/api" }: { baseUrl?: string } = {}) {
  return createClient<paths>({ baseUrl, credentials: "same-origin" });
}
