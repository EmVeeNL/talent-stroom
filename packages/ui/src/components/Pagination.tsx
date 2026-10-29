import { Button } from "./Button.tsx";
import { Select } from "./Select.tsx";
export interface PaginationProps {
  label: string;
  page: number;
  total: number;
  pageSize: number;
  pageSizes?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
  pageSizeLabel: string;
}
export function Pagination({
  label,
  page,
  total,
  pageSize,
  pageSizes = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  previousLabel,
  nextLabel,
  pageLabel,
  pageSizeLabel,
}: PaginationProps) {
  const size = Math.max(1, pageSize),
    pages = Math.max(1, Math.ceil(total / size)),
    current = Math.min(pages, Math.max(1, page));
  const shown = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => current + i - 2), pages])]
    .filter((n) => n >= 1 && n <= pages)
    .toSorted((a, b) => a - b);
  return (
    <nav className="ts-pagination" aria-label={label}>
      <div className="ts-pagination__pages">
        <Button
          variant="secondary"
          icon="chevron_left"
          aria-label={previousLabel}
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        />
        {shown.map((n, i) => (
          <span className="ts-pagination__page" key={n}>
            {i > 0 && n > (shown[i - 1] ?? 0) + 1 && <span aria-hidden="true">…</span>}
            <Button
              variant={n === current ? "primary" : "ghost"}
              aria-label={pageLabel(n)}
              aria-current={n === current ? "page" : undefined}
              onClick={() => onPageChange(n)}
            >
              {new Intl.NumberFormat("nl-NL").format(n)}
            </Button>
          </span>
        ))}
        <Button
          variant="secondary"
          icon="chevron_right"
          aria-label={nextLabel}
          disabled={current === pages}
          onClick={() => onPageChange(current + 1)}
        />
      </div>
      <Select label={pageSizeLabel} value={size} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
        {[...new Set([...pageSizes, size])]
          .toSorted((a, b) => a - b)
          .map((n) => (
            <option key={n} value={n}>
              {new Intl.NumberFormat("nl-NL").format(n)}
            </option>
          ))}
      </Select>
    </nav>
  );
}
