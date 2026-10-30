import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Checkbox } from "./Checkbox.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { Icon } from "./Icon.tsx";
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
}: DataTableProps<Row>) {
  const hintId = useId();
  const [localSort, setLocalSort] = useState<DataTableSort>();
  const sort = controlledSort ?? localSort;
  const setSort = (next: DataTableSort) => {
    setLocalSort(next);
    onSortChange?.(next);
  };
  const column = columns.find((c) => c.id === sort?.id);
  const sorted = column?.sortValue
    ? rows.toSorted((a, b) => {
        const av = column.sortValue?.(a) ?? "",
          bv = column.sortValue?.(b) ?? "";
        return (
          (typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "nl", { numeric: true })) *
          (sort?.direction === "descending" ? -1 : 1)
        );
      })
    : rows;
  const ids = rows.map(rowKey),
    all = ids.length > 0 && ids.every((id) => selectedIds.includes(id)),
    some = ids.some((id) => selectedIds.includes(id));
  const selectable = Boolean(onSelectionChange && selectAllLabel && selectRowLabel);
  return (
    <div className="ts-data-table-frame">
      {scrollLabel && (
        <p id={hintId} className="ts-data-table__scroll-hint">
          <Icon name="chevron_left" size={16} />
          {scrollLabel}
          <Icon name="chevron_right" size={16} />
        </p>
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
                      checked={all}
                      indeterminate={some && !all}
                      disabled={loading || ids.length === 0}
                      onChange={() =>
                        onSelectionChange?.(
                          all ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])],
                        )
                      }
                    />
                  </th>
                )}
                {columns.map((c) => (
                  <th key={c.id} scope="col" aria-sort={sort?.id === c.id ? sort.direction : undefined}>
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort({
                            id: c.id,
                            direction: sort?.id === c.id && sort.direction === "ascending" ? "descending" : "ascending",
                          })
                        }
                      >
                        {c.label}
                        <Icon
                          name={
                            sort?.id === c.id
                              ? sort.direction === "ascending"
                                ? "arrow_upward"
                                : "arrow_downward"
                              : "unfold_more"
                          }
                          size={20}
                        />
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
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
                      {columns.map((c) => (
                        <td key={c.id}>
                          <Skeleton shape="text" />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.map((row) => {
                    const id = rowKey(row);
                    return (
                      <tr key={id} data-selected={selectedIds.includes(id) || undefined}>
                        {selectable && (
                          <td>
                            <Checkbox
                              label={selectRowLabel?.(rowLabel?.(row) ?? id) ?? ""}
                              className="ts-data-table__select"
                              checked={selectedIds.includes(id)}
                              onChange={() =>
                                onSelectionChange?.(
                                  selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id],
                                )
                              }
                            />
                          </td>
                        )}
                        {columns.map((c) => (
                          <td key={c.id}>{c.cell(row)}</td>
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
        {!loading && sorted.length === 0 && (
          <p className="ts-data-table__empty" role="status">
            {emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
