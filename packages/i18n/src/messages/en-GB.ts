import type { MessageKey } from "./nl-NL.ts";

// Typed against the Dutch source: a missing or extra key fails the typecheck.
export const enGB = {
  "app.name": "TalentStroom",
  "app.tagline": "Recruiting without the hassle.",
  "app.welcome": "Welcome to {app}",
  "nav.dashboard": "Dashboard",
  "nav.vacancies": "Vacancies",
  "nav.candidates": "Candidates",
  "nav.clients": "Clients",
  "nav.tasks": "Tasks",
} as const satisfies Record<MessageKey, string>;
