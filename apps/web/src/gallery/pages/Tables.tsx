import { useState } from "react";
import {
  ActivityFeed,
  Avatar,
  Card,
  ContextMenu,
  DataTable,
  FacetedFilter,
  Pagination,
  SearchInput,
  StatusPill,
  ViewSwitcher,
} from "@talentstroom/ui";
import type { DataColumn, DataTableSort } from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
interface Candidate {
  id: string;
  name: string;
  role: string;
  location: string;
  status: string;
  source: string;
  tag: string;
}
const renderCandidateName = (r: Candidate) => (
  <span className="gallery-candidate-name">
    <Avatar name={r.name} size="sm" />
    {r.name}
  </span>
);

export function Tables() {
  const { tr, locale } = useGallery();
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState<string[]>([]),
    [source, setSource] = useState<string[]>([]),
    [tags, setTags] = useState<string[]>([]),
    [view, setView] = useState("table"),
    [selected, setSelected] = useState<string[]>([]),
    [page, setPage] = useState(1),
    [size, setSize] = useState(10);
  const [sort, setSort] = useState<DataTableSort>({ id: "name", direction: "ascending" });
  const names = [
    tr("gallery.data.sam"),
    tr("gallery.data.robin"),
    tr("gallery.data.jules"),
    tr("gallery.data.noa"),
    tr("gallery.data.alex"),
    tr("gallery.data.bo"),
    tr("gallery.data.kim"),
    tr("gallery.data.mika"),
    tr("gallery.data.ravi"),
    tr("gallery.data.tess"),
    tr("gallery.data.luca"),
    tr("gallery.data.charlie"),
  ];
  const statuses = [
    { value: "new", label: tr("gallery.data.status.new") },
    { value: "active", label: tr("gallery.data.status.active") },
    { value: "placed", label: tr("gallery.data.status.placed") },
  ];
  const sources = [
    { value: "referral", label: tr("gallery.data.source.referral") },
    { value: "website", label: tr("gallery.data.source.website") },
    { value: "event", label: tr("gallery.data.source.event") },
  ];
  const tagOptions = [
    { value: "tech", label: tr("gallery.data.tag.tech") },
    { value: "finance", label: tr("gallery.data.tag.finance") },
    { value: "hr", label: tr("gallery.data.tag.hr") },
  ];
  const rows: Candidate[] = names.map((name, i) => ({
    id: `candidate-${i}`,
    name,
    role: [tr("gallery.data.recruiter"), tr("gallery.data.developer"), tr("gallery.data.consultant")][i % 3] ?? "",
    location: [tr("gallery.data.utrecht"), tr("gallery.data.amsterdam"), tr("gallery.data.rotterdam")][i % 3] ?? "",
    status: statuses[i % 3]?.value ?? "new",
    source: sources[(i + Math.floor(i / 3)) % 3]?.value ?? "referral",
    tag: tagOptions[(i + Math.floor(i / 4)) % 3]?.value ?? "tech",
  }));
  const filtered = rows.filter(
    (r) =>
      `${r.name} ${r.role} ${r.location}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
      (!status.length || status.includes(r.status)) &&
      (!source.length || source.includes(r.source)) &&
      (!tags.length || tags.includes(r.tag)),
  );
  const renderPill = (r: Candidate) => (
    <StatusPill tone={r.status === "placed" ? "success" : r.status === "active" ? "warning" : "info"}>
      {statuses.find((o) => o.value === r.status)?.label}
    </StatusPill>
  );
  const renderActions = (r: Candidate) => (
    <ContextMenu
      triggerLabel={`${tr("gallery.cards.more")} · ${r.name}`}
      items={[{ id: "select", label: tr("gallery.cards.action"), onSelect: () => setSelected([r.id]) }]}
    />
  );
  const columns: DataColumn<Candidate>[] = [
    { id: "actions", label: tr("gallery.cards.more"), cell: renderActions },
    {
      id: "name",
      label: tr("gallery.tables.name"),
      sortValue: (r) => r.name,
      cell: renderCandidateName,
    },
    { id: "role", label: tr("gallery.tables.role"), cell: (r) => r.role, sortValue: (r) => r.role },
    { id: "location", label: tr("gallery.tables.location"), cell: (r) => r.location, sortValue: (r) => r.location },
    {
      id: "status",
      label: tr("gallery.filters.status"),
      cell: renderPill,
      sortValue: (r) => statuses.find((o) => o.value === r.status)?.label ?? "",
    },
    {
      id: "source",
      label: tr("gallery.filters.source"),
      cell: (r) => sources.find((o) => o.value === r.source)?.label,
    },
  ];
  const sortColumn = columns.find((c) => c.id === sort.id);
  const ordered = filtered.toSorted((a, b) => {
    const av = sortColumn?.sortValue?.(a) ?? "",
      bv = sortColumn?.sortValue?.(b) ?? "";
    return String(av).localeCompare(String(bv), locale, { numeric: true }) * (sort.direction === "ascending" ? 1 : -1);
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / size))),
    shown = ordered.slice((currentPage - 1) * size, currentPage * size);
  const tableProps = {
    caption: tr("gallery.tables.candidates"),
    columns,
    rowKey: (r: Candidate) => r.id,
    emptyLabel: tr("gallery.tables.empty"),
    loadingLabel: tr("gallery.tables.loading"),
  };
  const card = (r: Candidate) => (
    <Card key={r.id} title={r.name}>
      <div className="gallery-candidate-card">
        <Avatar name={r.name} />
        <p>
          {r.role}
          <br />
          {r.location}
        </p>
        {renderPill(r)}
      </div>
    </Card>
  );
  return (
    <>
      <Section title={tr("gallery.tables.candidates")}>
        <div className="gallery-stack">
          <div className="gallery-data-toolbar">
            <SearchInput
              label={tr("gallery.filters.search")}
              clearLabel={tr("gallery.filters.clear")}
              placeholder={tr("gallery.filters.searchHint")}
              onSearch={(value) => {
                setQuery(value);
                setPage(1);
              }}
              searchLandmark
            />
            {(
              [
                {
                  label: tr("gallery.filters.status"),
                  field: "status",
                  options: statuses,
                  value: status,
                  change: setStatus,
                },
                {
                  label: tr("gallery.filters.source"),
                  field: "source",
                  options: sources,
                  value: source,
                  change: setSource,
                },
                { label: tr("gallery.filters.tag"), field: "tag", options: tagOptions, value: tags, change: setTags },
              ] as const
            ).map((f) => (
              <FacetedFilter
                key={f.field}
                label={f.label}
                options={f.options.map((o) => ({ ...o, count: rows.filter((r) => r[f.field] === o.value).length }))}
                value={f.value}
                onChange={(value) => {
                  f.change(value);
                  setPage(1);
                }}
                searchLabel={tr("gallery.filters.searchOptions")}
                clearLabel={tr("gallery.filters.clear")}
                emptyLabel={tr("gallery.filters.noOptions")}
              />
            ))}
            <ViewSwitcher
              label={tr("gallery.filters.view")}
              value={view}
              onChange={setView}
              options={[
                { value: "table", label: tr("gallery.filters.table"), icon: "table_rows" },
                { value: "cards", label: tr("gallery.filters.cards"), icon: "grid_view" },
                { value: "kanban", label: tr("gallery.filters.kanban"), icon: "view_kanban" },
              ]}
            />
          </div>
          <output className="gallery-selection">
            {tr("gallery.tables.selected").replace("{count}", String(selected.length))}
          </output>
          {view === "table" ? (
            <DataTable
              {...tableProps}
              sort={sort}
              onSortChange={(next) => {
                setSort(next);
                setPage(1);
              }}
              rows={shown}
              selectedIds={selected}
              onSelectionChange={setSelected}
              rowLabel={(r) => r.name}
              selectAllLabel={tr("gallery.tables.selectAll")}
              selectRowLabel={(name) => tr("gallery.tables.selectRow").replace("{name}", name)}
            />
          ) : view === "cards" ? (
            <div className="gallery-data-grid">
              {shown.map(card)}
              {shown.length === 0 && <p>{tr("gallery.tables.empty")}</p>}
            </div>
          ) : (
            <div className="gallery-kanban">
              {statuses.map((s) => (
                <section key={s.value} aria-label={s.label}>
                  <h3>{s.label}</h3>
                  {shown.filter((r) => r.status === s.value).map(card)}
                </section>
              ))}
            </div>
          )}
          <Pagination
            label={tr("gallery.tables.pagination")}
            page={currentPage}
            total={filtered.length}
            pageSize={size}
            pageSizes={[5, 10, 25]}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setSize(n);
              setPage(1);
            }}
            previousLabel={tr("gallery.tables.previous")}
            nextLabel={tr("gallery.tables.next")}
            pageSizeLabel={tr("gallery.tables.pageSize")}
            pageLabel={(n) => tr("gallery.tables.page").replace("{page}", String(n))}
          />
        </div>
      </Section>
      <Section title={tr("gallery.tables.activity")}>
        <Card title={tr("gallery.tables.activity")} className="gallery-wide">
          <ActivityFeed
            label={tr("gallery.tables.activity")}
            locale={locale}
            now={new Date("2026-10-29T12:00:00Z")}
            items={[
              {
                id: "a",
                actor: tr("gallery.data.robin"),
                action: tr("gallery.tables.action1"),
                date: new Date("2026-10-29T11:55:00Z"),
              },
              {
                id: "b",
                actor: tr("gallery.data.sam"),
                action: tr("gallery.tables.action2"),
                date: new Date("2026-10-29T10:00:00Z"),
              },
              {
                id: "c",
                actor: tr("gallery.data.jules"),
                action: tr("gallery.tables.action3"),
                date: new Date("2026-10-28T12:00:00Z"),
              },
            ]}
          />
        </Card>
      </Section>
      <Section title={tr("gallery.tables.states")}>
        <div className="gallery-data-grid">
          <DataTable {...tableProps} rows={[]} />
          <DataTable {...tableProps} rows={[]} loading />
        </div>
      </Section>
      <Section title={tr("gallery.tables.avatars")}>
        <Avatar name={tr("gallery.data.sam")} size="sm" />
        <Avatar name={tr("gallery.data.robin")} />
        <Avatar name={tr("gallery.data.jules")} size="lg" />
        <Avatar
          name={tr("gallery.data.noa")}
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ctext x='8' y='27' font-size='20'%3ENV%3C/text%3E%3C/svg%3E"
        />
      </Section>
    </>
  );
}
