import { describe, expect, it } from "vitest";
import { DEMO_CONTACTS } from "../../../demo/apps.ts";
import { filterContacts, groupContacts } from "./groups.ts";

describe("contact groups", () => {
  it("groups by first letter in alphabetical order", () => {
    const groups = groupContacts(DEMO_CONTACTS);
    expect(groups.map((group) => group.letter)).toEqual(groups.map((group) => group.letter).toSorted());
    expect(groups[0]?.letter).toBe("A");
    expect(groups.find((group) => group.letter === "J")?.contacts.map((c) => c.name)).toEqual([
      "Joost van Dijk",
      "Joris van den Berg",
    ]);
  });

  it("filters by text and favourites", () => {
    expect(filterContacts(DEMO_CONTACTS, "brouwer", false).map((c) => c.name)).toEqual(["Ilse Brouwer"]);
    expect(filterContacts(DEMO_CONTACTS, "", true).every((c) => c.favourite)).toBe(true);
    expect(filterContacts(DEMO_CONTACTS, "zzz", false)).toEqual([]);
  });
});
