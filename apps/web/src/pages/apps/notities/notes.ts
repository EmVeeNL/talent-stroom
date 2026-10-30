import type { DemoNote } from "../../../demo/apps.ts";

export interface NoteFilters {
  query: string;
  tag: string;
  archived: boolean;
}

export function filterNotes(notes: readonly DemoNote[], { query, tag, archived }: NoteFilters): DemoNote[] {
  const needle = query.trim().toLocaleLowerCase("nl-NL");
  return notes.filter(
    (note) =>
      note.archived === archived &&
      (!tag || note.tags.includes(tag)) &&
      (!needle || `${note.title} ${note.body} ${note.tags.join(" ")}`.toLocaleLowerCase("nl-NL").includes(needle)),
  );
}

/** Pinned notes first, then the most recently changed. */
export function sortNotes(notes: readonly DemoNote[]): DemoNote[] {
  return notes.toSorted((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated.localeCompare(a.updated));
}

export const allTags = (notes: readonly DemoNote[]): string[] =>
  [...new Set(notes.flatMap((note) => note.tags))].toSorted((a, b) => a.localeCompare(b, "nl"));

export const parseTags = (value: string): string[] => [
  ...new Set(
    value
      .split(",")
      .map((tag) => tag.trim().toLocaleLowerCase("nl-NL"))
      .filter(Boolean),
  ),
];
