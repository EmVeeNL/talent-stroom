import type { DemoContact } from "../../../demo/apps.ts";

export interface ContactGroup {
  letter: string;
  contacts: readonly DemoContact[];
}

export function filterContacts(
  contacts: readonly DemoContact[],
  query: string,
  favouritesOnly: boolean,
): DemoContact[] {
  const needle = query.trim().toLocaleLowerCase("nl-NL");
  return contacts.filter(
    (contact) =>
      (!favouritesOnly || contact.favourite) &&
      (!needle || `${contact.name} ${contact.company} ${contact.function}`.toLocaleLowerCase("nl-NL").includes(needle)),
  );
}

/** Groups contacts by the first letter of their name, in alphabetical order. */
export function groupContacts(contacts: readonly DemoContact[]): ContactGroup[] {
  const groups = new Map<string, DemoContact[]>();
  for (const contact of contacts.toSorted((a, b) => a.name.localeCompare(b.name, "nl"))) {
    const letter = (contact.name.trim()[0] ?? "#").toLocaleUpperCase("nl-NL");
    groups.set(letter, [...(groups.get(letter) ?? []), contact]);
  }
  return [...groups].map(([letter, list]) => ({ letter, contacts: list }));
}
