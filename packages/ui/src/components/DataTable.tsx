import { useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { RowSelectionState } from "@tanstack/react-table";
import { Checkbox } from "./Checkbox.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { Icon } from "./Icon.tsx";
import { Pagination } from "./Pagination.tsx";

export interface DataColumn<Row> {
  id: string;
  label: string;
  cell: (row: Row) => ReactNode;
  sortValue?: (row: Row) => string | number;
}
export interface DataTableSort {
  id: string;
  direction: "ascending" | "descending";
}
export interface DataTablePagination {
  pageSize: number;
  label: string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
  pageSizeLabel: string;
  pageSizes?: number[];
}
export interface DataTableProps<Row> {
  density?: "comfortable" | "compact";
  /** Localized instruction, shown on narrow viewports. */
  scrollLabel?: string;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  caption: string;
  columns: DataColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  rowLabel?: (row: Row) => string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  selectAllLabel?: string;
  selectRowLabel?: (label: string) => string;
  emptyLabel: string;
  loadingLabel: string;
  loading?: boolean;
  errorLabel?: string;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  columnVisibilityLabel?: string;
  columnVisibilityOptions?: Array<{ id: string; label: string }>;
  pagination?: DataTablePagination;
}

const features = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

function compareValues(a: string | number, b: string | number): number {
  return typeof a === "number" && typeof b === "number"
    ? a - b
    : String(a).localeCompare(String(b), "nl", { numeric: true });
}

export function DataTable<Row>({
  caption,
  density = "comfortable",
  scrollLabel,
  sort: controlledSort,
  onSortChange,
  columns,
  rows,
  rowKey,
  rowLabel,
  selectedIds = [],
  onSelectionChange,
  selectAllLabel,
  selectRowLabel,
  emptyLabel,
  loadingLabel,
  loading = false,
  errorLabel,
  columnVisibility,
  onColumnVisibilityChange,
  columnVisibilityLabel,
  columnVisibilityOptions = [],
  pagination,
}: DataTableProps<Row>) {
  const [localSort, setLocalSort] = useState<DataTableSort>();
  const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(pagination?.pageSize ?? Math.max(rows.length, 1));
  const sort = controlledSort ?? localSort;
  const ids = useMemo(() => rows.map(rowKey), [rows, rowKey]);
  const tableRows = useMemo(
    () => rows.map((value, index) => ({ value, id: ids[index] ?? String(index) })),
    [rows, ids],
  );
  const tableColumns = useMemo(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: (row: { value: Row }) => column.sortValue?.(row.value) ?? "",
        enableSorting: Boolean(column.sortValue),
        sortFn: (a: { getValue: (id: string) => string | number }, b: { getValue: (id: string) => string | number }) =>
          compareValues(a.getValue(column.id), b.getValue(column.id)),
      })),
    [columns],
  );
  const visibility = columnVisibility ?? localVisibility;
  const sorting = sort ? [{ id: sort.id, desc: sort.direction === "descending" }] : [];
  const selection: RowSelectionState = Object.fromEntries(selectedIds.map((id) => [id, true as const]));
  const table = useTable<typeof features, { value: Row; id: string }>({
    features,
    columns: tableColumns,
    data: tableRows,
    getRowId: (row: { id: string }) => row.id,
    state: {
      sorting,
      rowSelection: selection,
      columnVisibility: visibility,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const first = next[0];
      if (first) {
        const value: DataTableSort = { id: first.id, direction: first.desc ? "descending" : "ascending" };
        if (controlledSort === undefined) setLocalSort(value);
        onSortChange?.(value);
      }
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(selection) : updater;
      onSelectionChange?.([...selectedIds.filter((id) => !ids.includes(id)), ...ids.filter((id) => Boolean(next[id]))]);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(visibility) : updater;
      if (columnVisibility === undefined) setLocalVisibility(next);
      onColumnVisibilityChange?.(next);
    },
  });
  const hintId = useId();
  const all = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
  const selectable = Boolean(onSelectionChange && selectAllLabel && selectRowLabel);
  const visibleColumns = table.getVisibleLeafColumns();
  const visibleRows = table.getRowModel().rows;
  const pageIds = pagination ? visibleRows.map((row) => row.id) : ids;
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someOnPage = pageIds.some((id) => selectedIds.includes(id));

  return (
    <div className="ts-data-table-frame">
      {scrollLabel && (
        <p id={hintId} className="ts-data-table__scroll-hint">
          <Icon name="chevron_left" size={16} />
          {scrollLabel}
          <Icon name="chevron_right" size={16} />
        </p>
      )}
      {columnVisibilityOptions.length > 0 && columnVisibilityLabel && (
        <fieldset className="ts-data-table__visibility">
          <legend>{columnVisibilityLabel}</legend>
          {columnVisibilityOptions.map((option) => (
            <Checkbox
              key={option.id}
              label={option.label}
              checked={visibility[option.id] !== false}
              onChange={() => table.getColumn(option.id)?.toggleVisibility()}
            />
          ))}
        </fieldset>
      )}
      <div className="ts-data-table-surface">
        <div
          className="ts-data-table"
          data-density={density}
          role="region"
          aria-label={caption}
          aria-describedby={scrollLabel ? hintId : undefined}
          tabIndex={0}
          aria-busy={loading || undefined}
        >
          <table>
            <caption>{caption}</caption>
            <thead>
              <tr>
                {selectable && (
                  <th scope="col">
                    <Checkbox
                      label={selectAllLabel ?? ""}
                      className="ts-data-table__select"
                      checked={pagination ? allOnPage : all}
                      indeterminate={pagination ? someOnPage && !allOnPage : someOnPage && !all}
                      disabled={loading || ids.length === 0}
                      onChange={() =>
                        pagination ? table.toggleAllPageRowsSelected(!allOnPage) : table.toggleAllRowsSelected(!all)
                      }
                    />
                  </th>
                )}
                {visibleColumns.map((tableColumn) => {
                  const column = columns.find((item) => item.id === tableColumn.id);
                  if (!column) return null;
                  const active = sort?.id === column.id;
                  return (
                    <th key={column.id} scope="col" aria-sort={active ? sort.direction : undefined}>
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => tableColumn.toggleSorting(active && sort.direction === "ascending")}
                        >
                          {column.label}
                          <Icon
                            name={
                              active
                                ? sort.direction === "ascending"
                                  ? "arrow_upward"
                                  : "arrow_downward"
                                : "unfold_more"
                            }
                            size={20}
                          />
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}>
                      {selectable && (
                        <td>
                          <Skeleton shape="text" />
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td key={column.id}>
                          <Skeleton shape="text" />
                        </td>
                      ))}
                    </tr>
                  ))
                : visibleRows.map((row) => {
                    const id = row.id;
                    return (
                      <tr key={id} data-selected={selectedIds.includes(id) || undefined}>
                        {selectable && (
                          <td>
                            <Checkbox
                              label={selectRowLabel?.(rowLabel?.(row.original.value) ?? id) ?? ""}
                              className="ts-data-table__select"
                              checked={Boolean(selection[id])}
                              onChange={() => row.toggleSelected(!selection[id])}
                            />
                          </td>
                        )}
                        {visibleColumns.map((column) => (
                          <td key={column.id}>
                            {columns.find((item) => item.id === column.id)?.cell(row.original.value)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {loading && (
            <span className="ts-visually-hidden" role="status">
              {loadingLabel}
            </span>
          )}
        </div>
        {errorLabel && !loading && (
          <p className="ts-data-table__empty" role="alert">
            {errorLabel}
          </p>
        )}
        {!errorLabel && !loading && rows.length === 0 && (
          <p className="ts-data-table__empty" role="status">
            {emptyLabel}
          </p>
        )}
      </div>
      {pagination && (
        <Pagination
          label={pagination.label}
          page={pageIndex + 1}
          total={rows.length}
          pageSize={pageSize}
          {...(pagination.pageSizes ? { pageSizes: pagination.pageSizes } : {})}
          onPageChange={(page) => setPageIndex(page - 1)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageIndex(0);
          }}
          previousLabel={pagination.previousLabel}
          nextLabel={pagination.nextLabel}
          pageLabel={pagination.pageLabel}
          pageSizeLabel={pagination.pageSizeLabel}
        />
      )}
    </div>
  );
}
