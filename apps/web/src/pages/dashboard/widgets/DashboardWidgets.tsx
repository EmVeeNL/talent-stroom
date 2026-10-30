import { createElement, useState } from "react";
import type { ReactNode } from "react";
import {
  Avatar,
  Badge,
  Card,
  ContextMenu,
  DataTable,
  Icon,
  KanbanBoard,
  StatCard,
  moveKanbanCard,
} from "@talentstroom/ui";
import type { DataColumn, KanbanLabels } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { candidates, initialPipeline } from "../../../demo/dashboard.ts";
import type { Candidate } from "../../../demo/dashboard.ts";
import "./dashboard-widgets.css";
export const tr = (
  locale: Locale,
  key: Extract<MessageKey, `demo.dashboard.${string}`>,
  values?: Record<string, string | number>,
) => t(locale, key, values);
export function Frame({
  breadcrumbs,
  title,
  subtitle,
  children,
  actions,
}: {
  breadcrumbs: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="demo-dashboard">
      {breadcrumbs}
      <div className="demo-dashboard__welcome">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {actions && <div className="demo-dashboard__welcome-aside">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
export function DashboardBreadcrumbs({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <div className="demo-dashboard__breadcrumbs">
      {children}
      <time dateTime="2026-10-30T14:32:00+01:00">
        <Icon name="calendar_month" size={16} />
        {tr(locale, "demo.dashboard.date")}, 14:32
      </time>
    </div>
  );
}
export function Stats({
  locale,
  items,
}: {
  locale: Locale;
  items: Array<{
    label: string;
    value: number;
    icon: "group" | "work" | "work_history" | "handshake" | "event" | "business" | "task_alt" | "shield";
    trend: number;
    tone?: "primary" | "success" | "violet" | "accent";
  }>;
}) {
  return (
    <div className="demo-stats">
      {items.map((x) => (
        <StatCard
          key={x.label}
          label={x.label}
          value={x.value}
          locale={locale}
          icon={x.icon}
          {...(x.tone ? { tone: x.tone } : {})}
          trend={{ value: x.trend, comparisonLabel: tr(locale, "demo.dashboard.vs-month") }}
          sparkline={{ values: [12, 18, 15, 24, 21, 32, 28], label: tr(locale, "demo.dashboard.trend") }}
        />
      ))}
    </div>
  );
}
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card as="section" title={title} className={`demo-panel ${className}`}>
      {children}
    </Card>
  );
}
export function Pipeline({ locale }: { locale: Locale }) {
  const [board, setBoard] = useState(initialPipeline);
  const labels: KanbanLabels = {
    board: tr(locale, "demo.dashboard.pipeline"),
    instructions: tr(locale, "demo.dashboard.kanban-help"),
    cardRole: tr(locale, "demo.dashboard.candidate-card"),
    count: (n) => tr(locale, "demo.dashboard.count", { count: n }),
    addCardShort: tr(locale, "demo.dashboard.add"),
    addCard: (s) => tr(locale, "demo.dashboard.add-to", { stage: s }),
    collapse: (s) => tr(locale, "demo.dashboard.collapse", { stage: s }),
    expand: (s) => tr(locale, "demo.dashboard.expand", { stage: s }),
    columnMenu: (s) => tr(locale, "demo.dashboard.stage-actions", { stage: s }),
    cardMenu: (s) => tr(locale, "demo.dashboard.candidate-actions", { name: s }),
    moveTo: (s) => tr(locale, "demo.dashboard.move-to", { stage: s }),
    emptyTitle: tr(locale, "demo.dashboard.empty-title"),
    emptyBody: tr(locale, "demo.dashboard.empty-body"),
    pickedUp: (a) => tr(locale, "demo.dashboard.picked-up", { name: a.name }),
    moving: (a) => tr(locale, "demo.dashboard.moving", { name: a.name, column: a.column }),
    moved: (a) => tr(locale, "demo.dashboard.moved", { name: a.name, column: a.column }),
    cancelled: (n) => tr(locale, "demo.dashboard.cancelled", { name: n }),
  };
  return (
    <Panel title={tr(locale, "demo.dashboard.pipeline")}>
      <KanbanBoard columns={board} labels={labels} onMove={(move) => setBoard(moveKanbanCard(board, move))} />
    </Panel>
  );
}
function candidateNameCell(r: Candidate) {
  return createElement("span", { className: "demo-person" }, createElement(Avatar, { name: r.name }), r.name);
}
function candidateStatusCell(r: Candidate) {
  return createElement("span", { className: `ts-badge ts-badge--${r.tone} ts-badge--subtle ts-badge--pill` }, r.status);
}
function candidateActionsCell(r: Candidate) {
  return createElement(ContextMenu, {
    triggerLabel: `Meer acties voor ${r.name}`,
    items: [{ id: "open", label: "Kandidaat bekijken", onSelect: () => undefined }],
  });
}
export function Candidates({ locale }: { locale: Locale }) {
  const cols: DataColumn<Candidate>[] = [
    {
      id: "name",
      label: tr(locale, "demo.dashboard.name"),
      cell: candidateNameCell,
      sortValue: (r) => r.name,
    },
    { id: "role", label: tr(locale, "demo.dashboard.role"), cell: (r) => r.role },
    { id: "city", label: tr(locale, "demo.dashboard.location"), cell: (r) => r.city },
    {
      id: "status",
      label: tr(locale, "demo.dashboard.status"),
      cell: candidateStatusCell,
    },
    { id: "date", label: tr(locale, "demo.dashboard.date-short"), cell: (r) => r.date },
  ];
  cols.push({
    id: "actions",
    label: tr(locale, "demo.dashboard.actions"),
    hideLabel: true,
    width: 48,
    cell: candidateActionsCell,
  });
  return (
    <Panel title={tr(locale, "demo.dashboard.recent-candidates")}>
      <DataTable
        caption={tr(locale, "demo.dashboard.recent-candidates")}
        columns={cols}
        rows={candidates}
        density="compact"
        onSelectionChange={() => undefined}
        selectAllLabel={tr(locale, "demo.dashboard.select-all")}
        selectRowLabel={(name) => tr(locale, "demo.dashboard.select-row", { name })}
        rowKey={(r) => r.id}
        emptyLabel={tr(locale, "demo.dashboard.empty-title")}
        loadingLabel={tr(locale, "demo.dashboard.loading")}
        scrollLabel={tr(locale, "demo.dashboard.table-scroll")}
      />
    </Panel>
  );
}
export function TaskList({ locale }: { locale: Locale }) {
  const [checked, setChecked] = useState([true, false, false, false]);
  const tasks = [
    "demo.dashboard.task1",
    "demo.dashboard.task2",
    "demo.dashboard.task3",
    "demo.dashboard.task4",
  ] as const;
  return (
    <Panel title={tr(locale, "demo.dashboard.tasks-today")}>
      <ul className="demo-task-list">
        {tasks.map((key, i) => (
          <li key={key}>
            <label>
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked(checked.map((v, j) => (j === i ? !v : v)))}
              />
              <span>{tr(locale, key)}</span>
            </label>
            <time>{["09:00", "10:30", "13:00", "15:00"][i]}</time>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
export function Activity({ locale }: { locale: Locale }) {
  return (
    <Panel title={tr(locale, "demo.dashboard.activity")}>
      <ul className="demo-activity">
        {[
          "Mark Scholten heeft het aanbod geaccepteerd",
          "Sanne de Groot toegevoegd aan de shortlist",
          "Nieuwe sollicitatie ontvangen",
        ].map((s, i) => (
          <li key={s}>
            <Avatar name={["Mark Scholten", "Sanne de Groot", "Noor Bakker"][i] ?? "Noor Bakker"} />
            <span>
              {s}
              <small>{["5 minuten geleden", "1 uur geleden", "2 uur geleden"][i]}</small>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
export function Bars({
  locale,
  title,
  items,
}: {
  locale: Locale;
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  void locale;
  return (
    <Panel title={title}>
      <div className="demo-bars">
        {items.map((x) => (
          <div key={x.label}>
            <span>{x.label}</span>
            <div>
              <i style={{ width: `${x.value}%` }} />
            </div>
            <b>{x.value}%</b>
          </div>
        ))}
      </div>
    </Panel>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return <Badge tone="success">{children}</Badge>;
}
