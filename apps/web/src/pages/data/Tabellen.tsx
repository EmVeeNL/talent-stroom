import { useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Avatar, Breadcrumb, Card, DataTable, Pagination, PageHeader, StatusPill } from "@talentstroom/ui";
import type { DataColumn, DataTableSort } from "@talentstroom/ui";
import "./data-pages.css";

interface DemoCandidate {
  id: string;
  name: string;
  role: string;
  city: string;
  status: "new" | "active" | "placed";
}

function CandidateNameCell({ row }: { row: DemoCandidate }) {
  return (
    <span className="data-candidate">
      <Avatar name={row.name} size="sm" />
      {row.name}
    </span>
  );
}

function CandidateStatusCell({ row, locale }: { row: DemoCandidate; locale: Locale }) {
  return (
    <StatusPill tone={row.status === "placed" ? "success" : row.status === "active" ? "warning" : "info"}>
      {t(locale, `demo.data.data.status.${row.status}`)}
    </StatusPill>
  );
}

function renderCandidateName(row: DemoCandidate) {
  return <CandidateNameCell row={row} />;
}

function renderCandidateStatus(row: DemoCandidate, locale: Locale) {
  return <CandidateStatusCell row={row} locale={locale} />;
}

export default function TabellenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.data.tabellen");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sort, setSort] = useState<DataTableSort>({ id: "name", direction: "ascending" });
  const names = [
    "Sanne Willems",
    "Joris van den Berg",
    "Fatima El Amrani",
    "Daan Visser",
    "Lotte Hendriks",
    "Mehmet Yilmaz",
    "Emma de Boer",
    "Thijs Mulder",
    "Noor Bakker",
    "Pieter Jansen",
    "Mila Smit",
    "Timo de Groot",
  ];
  const statuses = ["new", "active", "placed"] as const;
  const rows: DemoCandidate[] = names.map((name, index) => ({
    id: `candidate-${index + 1}`,
    name,
    role: ["Frontend Developer", "Backend Developer", "Product Designer"][index % 3] ?? "Developer",
    city: ["Amsterdam", "Utrecht", "Rotterdam"][index % 3] ?? "Amsterdam",
    status: statuses[index % statuses.length] ?? "new",
  }));
  const columns: DataColumn<DemoCandidate>[] = [
    {
      id: "name",
      label: t(locale, "demo.data.tables.name"),
      cell: renderCandidateName,
      sortValue: (row) => row.name,
    },
    { id: "role", label: t(locale, "demo.data.tables.role"), cell: (row) => row.role, sortValue: (row) => row.role },
    {
      id: "location",
      label: t(locale, "demo.data.tables.location"),
      cell: (row) => row.city,
      sortValue: (row) => row.city,
    },
    {
      id: "status",
      label: t(locale, "demo.data.filters.status"),
      cell: (row) => renderCandidateStatus(row, locale),
      sortValue: (row) => t(locale, `demo.data.data.status.${row.status}`),
    },
  ];
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const tableProps = {
    caption: t(locale, "demo.data.tables.candidates"),
    columns,
    rowKey: (row: DemoCandidate) => row.id,
    rowLabel: (row: DemoCandidate) => row.name,
    emptyLabel: t(locale, "demo.data.tables.empty"),
    loadingLabel: t(locale, "demo.data.tables.loading"),
    selectAllLabel: t(locale, "demo.data.tables.selectAll"),
    selectRowLabel: (name: string) => t(locale, "demo.data.tables.selectRow").replace("{name}", name),
  };
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.data") }, { label: title }]}
      />
      <PageHeader title={title} />
      <div className="data-page-stack">
        <Card
          as="section"
          title={t(locale, "demo.data.tables.candidates")}
          subtitle={t(locale, "demo.data.tables.selected").replace("{count}", String(selected.length))}
        >
          <div className="data-table-controls">
            <label className="data-density-control">
              {t(locale, "demo.data.tables.density")}
              <select
                value={density}
                onChange={(event) => setDensity(event.target.value === "compact" ? "compact" : "comfortable")}
              >
                <option value="comfortable">{t(locale, "demo.data.tables.comfortable")}</option>
                <option value="compact">{t(locale, "demo.data.tables.compact")}</option>
              </select>
            </label>
            <span className="data-table-selection" aria-live="polite">
              {t(locale, "demo.data.tables.selected").replace("{count}", String(selected.length))}
            </span>
          </div>
          <DataTable
            {...tableProps}
            density={density}
            rows={visibleRows}
            selectedIds={selected}
            onSelectionChange={setSelected}
            sort={sort}
            onSortChange={setSort}
            scrollLabel={t(locale, "demo.data.tables.scroll")}
          />
          <Pagination
            label={t(locale, "demo.data.tables.pagination")}
            page={page}
            total={rows.length}
            pageSize={pageSize}
            pageSizes={[5, 10]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            previousLabel={t(locale, "demo.data.tables.previous")}
            nextLabel={t(locale, "demo.data.tables.next")}
            pageSizeLabel={t(locale, "demo.data.tables.pageSize")}
            pageLabel={(number) => t(locale, "demo.data.tables.page").replace("{page}", String(number))}
          />
        </Card>
        <div className="data-state-grid">
          <Card as="section" title={t(locale, "demo.data.tables.empty")}>
            <DataTable {...tableProps} rows={[]} />
          </Card>
          <Card as="section" title={t(locale, "demo.data.tables.loading")}>
            <DataTable {...tableProps} rows={[]} loading />
          </Card>
        </div>
      </div>
    </>
  );
}
