import { describe, expect, it } from "vitest";
import type { KanbanColumnData } from "@talentstroom/ui";
import { PIPELINE_CANDIDATES } from "../../../demo/apps.ts";
import { matchesFilters, moveInFullBoard } from "./pipeline.ts";

const card = (id: string) => ({ id, name: id });
const full: KanbanColumnData[] = [
  { id: "a", title: "A", cards: [card("1"), card("2"), card("3")] },
  { id: "b", title: "B", cards: [card("4"), card("5")] },
];

describe("pipeline", () => {
  it("filters by text and recruiter", () => {
    const sanne = PIPELINE_CANDIDATES.find((candidate) => candidate.name === "Sanne Willems");
    expect(sanne).toBeDefined();
    if (!sanne) return;
    expect(matchesFilters(sanne, { query: "spring", recruiter: "" })).toBe(true);
    expect(matchesFilters(sanne, { query: "", recruiter: "Ruben de Wit" })).toBe(false);
    expect(matchesFilters(sanne, { query: "SANNE", recruiter: sanne.recruiter })).toBe(true);
  });

  it("keeps hidden cards in place when moving on a filtered board", () => {
    const filtered: KanbanColumnData[] = [
      { id: "a", title: "A", cards: [card("1"), card("3")] },
      { id: "b", title: "B", cards: [card("5")] },
    ];
    const result = moveInFullBoard(full, filtered, { cardId: "3", fromColumnId: "a", toColumnId: "b", toIndex: 1 });
    expect(result[0]?.cards.map((c) => c.id)).toEqual(["1", "2"]);
    expect(result[1]?.cards.map((c) => c.id)).toEqual(["4", "5", "3"]);
  });
});
