import { useState } from "react";
import { KanbanBoard, moveKanbanCard } from "@talentstroom/ui";
import type { ContextMenuItem, KanbanColumnData, KanbanLabels } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { useGallery } from "../context.ts";
import { Section } from "../Section.tsx";

type StageId = "nieuw" | "in_behandeling" | "gesprek" | "aanbod" | "geplaatst" | "afgewezen";
const STAGES: readonly { id: StageId; tone: KanbanColumnData["tone"] }[] = [
  { id: "nieuw", tone: "info" },
  { id: "in_behandeling", tone: "warning" },
  { id: "gesprek", tone: "violet" },
  { id: "aanbod", tone: "accent" },
  { id: "geplaatst", tone: "success" },
  { id: "afgewezen", tone: "danger" },
];
interface Person {
  name: string;
  role: string;
  days: number;
  source: string;
  tags: readonly [string, string];
  urgent?: boolean;
}
/** Synthetic people only; roles are job titles used as demo data. */
const PEOPLE: Record<StageId, readonly Person[]> = {
  nieuw: [
    { name: "Sanne Willems", role: "Senior Java Developer", days: 1, source: "LinkedIn", tags: ["Java", "Spring"] },
    {
      name: "Joris van den Berg",
      role: "Software Tester",
      days: 2,
      source: "Website",
      tags: ["Selenium", "Cypress"],
      urgent: true,
    },
    { name: "Fatima El Amrani", role: "Backend Developer", days: 3, source: "Referral", tags: ["Kotlin", "AWS"] },
    { name: "Daan Visser", role: "DevOps Engineer", days: 5, source: "LinkedIn", tags: ["Docker", "Terraform"] },
  ],
  in_behandeling: [
    { name: "Lotte Hendriks", role: "Full Stack Developer", days: 2, source: "Website", tags: ["React", "TypeScript"] },
    { name: "Mehmet Yilmaz", role: "Data Engineer", days: 4, source: "Referral", tags: ["Python", "Spark"] },
    { name: "Emma de Boer", role: "Product Designer", days: 6, source: "LinkedIn", tags: ["Figma", "UX"] },
  ],
  gesprek: [
    { name: "Thijs Mulder", role: "Senior Java Developer", days: 3, source: "LinkedIn", tags: ["Java", "Kubernetes"] },
    { name: "Noor Bakker", role: "Frontend Developer", days: 1, source: "Website", tags: ["TypeScript", "CSS"] },
  ],
  aanbod: [
    { name: "Pieter Jansen", role: "Technical Lead", days: 2, source: "Referral", tags: ["Architectuur", "Scrum"] },
  ],
  geplaatst: [],
  afgewezen: [],
};

function createColumns(locale: Locale): KanbanColumnData[] {
  return STAGES.map(({ id, tone }) => ({
    id,
    tone,
    title: t(locale, `recruitment.stage.${id}`),
    cards: PEOPLE[id].map((person, index) => ({
      id: `${id}-${index}`,
      name: person.name,
      role: person.role,
      meta: person.source,
      age: `${person.days}d`,
      ageLabel: t(locale, "gallery.kanban.daysInStage", { count: person.days }),
      tags: person.tags,
      status: person.urgent ? { label: t(locale, "gallery.kanban.urgent"), tone: "danger" as const } : undefined,
    })),
  }));
}

export function createLabels(locale: Locale): KanbanLabels {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  return {
    board: tr("kanban.board"),
    instructions: tr("kanban.instructions"),
    cardRole: tr("kanban.cardRole"),
    addCardShort: tr("kanban.addCardShort"),
    count: (count) => tr("kanban.count", { count }),
    addCard: (column) => tr("kanban.addCard", { column }),
    collapse: (column) => tr("kanban.collapse", { column }),
    expand: (column) => tr("kanban.expand", { column }),
    columnMenu: (column) => tr("kanban.columnMenu", { column }),
    cardMenu: (name) => tr("kanban.cardMenu", { name }),
    moveTo: (column) => tr("kanban.moveTo", { column }),
    emptyTitle: tr("kanban.emptyTitle"),
    emptyBody: tr("kanban.emptyBody"),
    pickedUp: (value) => tr("kanban.pickedUp", { ...value }),
    moving: (value) => tr("kanban.moving", { ...value }),
    moved: (value) => tr("kanban.moved", { ...value }),
    cancelled: (name) => tr("kanban.cancelled", { name }),
  };
}

export function Kanban() {
  const { tr, locale } = useGallery();
  const [columns, setColumns] = useState(() => createColumns(locale));
  const [listColumns, setListColumns] = useState(() => createColumns(locale).slice(0, 3));
  const labels = createLabels(locale);
  const menu = (): ContextMenuItem[] => [
    { id: "open", label: tr("gallery.kanban.openProfile"), icon: "person", onSelect: () => undefined },
    { id: "note", label: tr("gallery.kanban.addNote"), icon: "edit", onSelect: () => undefined },
  ];
  return (
    <>
      <Section title={tr("gallery.kanban.board")}>
        <p className="gallery-overlay-intro">{tr("gallery.kanban.boardHint")}</p>
        <div className="gallery-pipeline">
          <KanbanBoard
            columns={columns}
            labels={labels}
            defaultCollapsedColumnIds={["aanbod"]}
            onMove={(move) => setColumns((previous) => moveKanbanCard(previous, move))}
            onAddCard={() => undefined}
            columnMenuItems={() => [
              { id: "sort", label: tr("gallery.kanban.sort"), icon: "sort", onSelect: () => undefined },
            ]}
            cardMenuItems={menu}
          />
        </div>
      </Section>
      <Section title={tr("gallery.kanban.list")}>
        <div className="gallery-pipeline gallery-pipeline--narrow">
          <KanbanBoard
            view="list"
            columns={listColumns}
            labels={labels}
            onMove={(move) => setListColumns((previous) => moveKanbanCard(previous, move))}
            onAddCard={() => undefined}
            cardMenuItems={menu}
          />
        </div>
      </Section>
    </>
  );
}
