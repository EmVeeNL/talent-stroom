import type { MessageKey } from "./nl-NL.ts";

// Typed against the Dutch source: a missing or extra key fails the typecheck.
export const enGB = {
  "api.problem.validationError": "Validation error",
  "api.problem.payloadTooLarge": "Payload Too Large",
  "api.problem.malformedJson": "Malformed JSON",
  "api.problem.notFound": "Not Found",
  "api.problem.internalError": "Internal Server Error",
  "api.problem.tooManyRequests": "Too Many Requests",
  "api.problem.invalidValue": "Invalid value",
  "app.name": "TalentStroom",
  "app.tagline": "Recruiting without the hassle.",
  "app.apiStatus.loading": "Loading API status…",
  "app.apiStatus.error": "API status unavailable",
  "app.welcome": "Welcome to {app}",
  "nav.dashboard": "Dashboard",
  "nav.vacancies": "Vacancies",
  "nav.candidates": "Candidates",
  "nav.clients": "Clients",
  "nav.tasks": "Tasks",
} as const satisfies Record<MessageKey, string>;
