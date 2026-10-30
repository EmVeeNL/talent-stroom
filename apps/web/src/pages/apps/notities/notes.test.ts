import { describe, expect, it } from "vitest";
import { DEMO_NOTES } from "../../../demo/apps.ts";
import { allTags, filterNotes, parseTags, sortNotes } from "./notes.ts";

describe("notes", () => {
  it("hides archived notes unless asked and filters by text and tag", () => {
    expect(filterNotes(DEMO_NOTES, { query: "", tag: "", archived: false }).every((n) => !n.archived)).toBe(true);
    expect(filterNotes(DEMO_NOTES, { query: "", tag: "", archived: true })).toHaveLength(1);
    expect(filterNotes(DEMO_NOTES, { query: "benchmark", tag: "", archived: false })).toHaveLength(1);
    expect(filterNotes(DEMO_NOTES, { query: "", tag: "klant", archived: false })).toHaveLength(1);
  });

  it("sorts pinned notes first", () => {
    const sorted = sortNotes(filterNotes(DEMO_NOTES, { query: "", tag: "", archived: false }));
    expect(sorted.slice(0, 2).every((note) => note.pinned)).toBe(true);
    expect((sorted[2]?.updated ?? "") >= (sorted[3]?.updated ?? "")).toBe(true);
  });

  it("normalises tags", () => {
    expect(parseTags(" Klant, intake,klant ,")).toEqual(["klant", "intake"]);
    expect(allTags(DEMO_NOTES)).toContain("markt");
  });
});
