/* oxlint-disable react/no-unstable-nested-components -- render props of ui components (Dialog footer, DataTable cells) */
import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Avatar, Button, KanbanBoard, SearchInput, Select, Sheet, StageBadge, StatusPill } from "@talentstroom/ui";
import type { KanbanCardData, KanbanColumnData, KanbanLabels } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { PIPELINE_CANDIDATES, PIPELINE_RECRUITERS, PIPELINE_VACANCY } from "../../../demo/apps.ts";
import type { PipelineCandidate, PipelineStage } from "../../../demo/apps.ts";
import { matchesFilters, moveInFullBoard } from "./pipeline.ts";
import "./kanban.css";

const STAGES: readonly { id: PipelineStage; tone: KanbanColumnData["tone"] }[] = [
  { id: "nieuw", tone: "info" },
  { id: "in_behandeling", tone: "warning" },
  { id: "gesprek", tone: "violet" },
  { id: "aanbod", tone: "accent" },
  { id: "geplaatst", tone: "success" },
  { id: "afgewezen", tone: "danger" },
];

export function kanbanLabels(locale: Locale): KanbanLabels {
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

export function KanbanApp({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const byId = useMemo(() => new Map(PIPELINE_CANDIDATES.map((candidate) => [candidate.id, candidate])), []);
  const [columns, setColumns] = useState<readonly KanbanColumnData[]>(() =>
    STAGES.map(({ id, tone }) => ({
      id,
      tone,
      title: tr(`recruitment.stage.${id}`),
      cards: PIPELINE_CANDIDATES.filter((candidate) => candidate.stage === id).map((candidate): KanbanCardData => ({
        id: candidate.id,
        name: candidate.name,
        role: candidate.role,
        meta: `${candidate.source} · ${candidate.recruiter}`,
        age: `${candidate.daysInStage}d`,
        ageLabel: tr("demo.apps.kanban.days_in_stage", { count: candidate.daysInStage }),
        tags: candidate.tags,
        href: `#${candidate.id}`,
        status: candidate.urgent ? { label: tr("demo.apps.kanban.urgent"), tone: "danger" as const } : undefined,
      })),
    })),
  );
  const [query, setQuery] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  const filters = { query, recruiter };
  const filtered = columns.map((column): KanbanColumnData => ({
    id: column.id,
    title: column.title,
    tone: column.tone,
    cards: column.cards.filter((card) => {
      const candidate = byId.get(card.id);
      return candidate ? matchesFilters(candidate, filters) : false;
    }),
  }));
  const total = filtered.reduce((sum, column) => sum + column.cards.length, 0);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedColumnId = columns.find((column) => column.cards.some((card) => card.id === selectedId))?.id;
  const selectedStage = STAGES.find((stage) => stage.id === selectedColumnId)?.id;

  const onBoardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    // Menus and buttons keep their own behaviour; every other click on a card opens its details.
    if (!target || target.closest("button, [role='menu'], [role='menuitem']")) return;
    const id = target.closest<HTMLElement>("[data-card-id]")?.dataset["cardId"];
    if (!id) return;
    event.preventDefault();
    opener.current = event.target instanceof HTMLElement ? event.target : null;
    setSelectedId(id);
    setOpen(true);
  };

  return (
    <div className="pipeline">
      <div className="pipeline__bar">
        <p className="pipeline__vacancy">
          <strong>{PIPELINE_VACANCY}</strong>
          <span aria-live="polite">{tr("demo.apps.kanban.count", { count: total })}</span>
        </p>
        <div className="pipeline__filters">
          <SearchInput
            label={tr("demo.apps.kanban.search")}
            clearLabel={tr("demo.apps.kanban.search_clear")}
            placeholder={tr("demo.apps.kanban.search_placeholder")}
            value={query}
            onChange={setQuery}
            searchLandmark
          />
          <Select
            label={tr("demo.apps.kanban.recruiter")}
            value={recruiter}
            onChange={(event) => setRecruiter(event.target.value)}
            placeholder={tr("demo.apps.kanban.all_recruiters")}
          >
            {PIPELINE_RECRUITERS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Clicks bubble up from the cards; the board itself stays a pure presentational component. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="pipeline__board" onClick={onBoardClick}>
        <KanbanBoard
          columns={filtered}
          labels={kanbanLabels(locale)}
          headingLevel={2}
          onMove={(move) => setColumns((previous) => moveInFullBoard(previous, filtered, move))}
        />
      </div>

      <Sheet
        title={selected?.name ?? ""}
        triggerLabel={tr("demo.apps.kanban.open_details")}
        closeLabel={tr("demo.apps.kanban.close")}
        hideTrigger
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) opener.current?.focus();
        }}
        footer={(close) => (
          <Button variant="outline" onClick={close}>
            {tr("demo.apps.kanban.close")}
          </Button>
        )}
      >
        {selected && <CandidateDetails candidate={selected} stage={selectedStage ?? selected.stage} locale={locale} />}
      </Sheet>
    </div>
  );
}

function CandidateDetails({
  candidate,
  stage,
  locale,
}: {
  candidate: PipelineCandidate;
  stage: PipelineStage;
  locale: Locale;
}) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const rows: readonly [MessageKey, string][] = [
    ["demo.apps.kanban.detail.recruiter", candidate.recruiter],
    ["demo.apps.kanban.detail.source", candidate.source],
    ["demo.apps.kanban.detail.city", candidate.city],
    ["demo.apps.kanban.detail.salary", candidate.salary],
    ["demo.apps.kanban.detail.days", tr("demo.apps.kanban.days_in_stage", { count: candidate.daysInStage })],
  ];
  return (
    <div className="pipeline-detail">
      <div className="pipeline-detail__head">
        <Avatar name={candidate.name} size="lg" />
        <div>
          <p className="pipeline-detail__role">{candidate.role}</p>
          <p className="pipeline-detail__badges">
            <StageBadge stage={stage}>{tr(`recruitment.stage.${stage}`)}</StageBadge>
            {candidate.urgent && <StatusPill tone="danger">{tr("demo.apps.kanban.urgent")}</StatusPill>}
          </p>
        </div>
      </div>
      <dl className="pipeline-detail__list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{tr(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt>{tr("demo.apps.kanban.detail.email")}</dt>
          <dd>
            <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
          </dd>
        </div>
        <div>
          <dt>{tr("demo.apps.kanban.detail.phone")}</dt>
          <dd>
            <a href={`tel:${candidate.phone.replaceAll("-", "")}`}>{candidate.phone}</a>
          </dd>
        </div>
      </dl>
      <h3>{tr("demo.apps.kanban.detail.skills")}</h3>
      <ul className="pipeline-detail__tags">
        {candidate.tags.map((tag) => (
          <li key={tag}>
            <StatusPill>{tag}</StatusPill>
          </li>
        ))}
      </ul>
      <h3>{tr("demo.apps.kanban.detail.note")}</h3>
      <p>{candidate.note}</p>
    </div>
  );
}
