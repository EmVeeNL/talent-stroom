import { moveKanbanCard } from "@talentstroom/ui";
import type { KanbanColumnData, KanbanMove } from "@talentstroom/ui";
import type { PipelineCandidate } from "../../../demo/apps.ts";

export interface PipelineFilters {
  query: string;
  recruiter: string;
}

export const matchesFilters = (candidate: PipelineCandidate, { query, recruiter }: PipelineFilters): boolean => {
  const needle = query.trim().toLocaleLowerCase("nl-NL");
  const text = [candidate.name, candidate.role, ...candidate.tags].join(" ").toLocaleLowerCase("nl-NL");
  return (!needle || text.includes(needle)) && (!recruiter || candidate.recruiter === recruiter);
};

/**
 * Applies a move made on a filtered board to the complete board. The card lands behind the card that
 * precedes it in the filtered column, so hidden cards keep their relative order.
 */
export function moveInFullBoard(
  full: readonly KanbanColumnData[],
  filtered: readonly KanbanColumnData[],
  move: KanbanMove,
): KanbanColumnData[] {
  const moved = moveKanbanCard(filtered, move).find((column) => column.id === move.toColumnId);
  const position = moved?.cards.findIndex((card) => card.id === move.cardId) ?? -1;
  const previousId = position > 0 ? moved?.cards[position - 1]?.id : undefined;
  const destination = full.find((column) => column.id === move.toColumnId);
  const remaining = destination?.cards.filter((card) => card.id !== move.cardId) ?? [];
  const toIndex = previousId ? remaining.findIndex((card) => card.id === previousId) + 1 : 0;
  return moveKanbanCard(full, { ...move, toIndex });
}
