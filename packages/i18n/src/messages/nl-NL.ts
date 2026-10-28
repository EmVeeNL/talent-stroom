/** Source catalog. Keys are stable identifiers; never store translated labels in the database. */
export const nlNL = {
  "app.name": "TalentStroom",
  "app.tagline": "Werven zonder gedoe.",
  "app.welcome": "Welkom bij {app}",
  "nav.dashboard": "Dashboard",
  "nav.vacancies": "Vacatures",
  "nav.candidates": "Kandidaten",
  "nav.clients": "Opdrachtgevers",
  "nav.tasks": "Taken",
} as const;

export type MessageKey = keyof typeof nlNL;
