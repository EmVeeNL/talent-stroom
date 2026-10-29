import { useState } from "react";
import { Button } from "./Button.tsx";
import { Checkbox } from "./Checkbox.tsx";
import { Popover } from "./Popover.tsx";
import { SearchInput } from "./SearchInput.tsx";
export interface FacetOption {
  value: string;
  label: string;
  count: number;
}
export interface FacetedFilterProps {
  label: string;
  options: FacetOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchLabel: string;
  clearLabel: string;
  emptyLabel: string;
  disabled?: boolean;
}
export function FacetedFilter({
  label,
  options,
  value,
  onChange,
  searchLabel,
  clearLabel,
  emptyLabel,
  disabled,
}: FacetedFilterProps) {
  const [query, setQuery] = useState("");
  const filtered = options.filter((o) => o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return (
    <Popover
      label={label}
      trigger={
        <Button variant="secondary" icon="filter_list" disabled={disabled}>
          {label}
          {value.length > 0 && <span className="ts-facet__count">{value.length}</span>}
        </Button>
      }
    >
      <div className="ts-facet">
        <SearchInput label={searchLabel} clearLabel={clearLabel} value={query} onChange={setQuery} />
        <div className="ts-facet__options">
          {filtered.map((o) => (
            <div className="ts-facet__option" key={o.value}>
              <Checkbox
                label={`${o.label} (${new Intl.NumberFormat("nl-NL").format(o.count)})`}
                checked={value.includes(o.value)}
                onChange={() =>
                  onChange(value.includes(o.value) ? value.filter((v) => v !== o.value) : [...value, o.value])
                }
              />
            </div>
          ))}
          {filtered.length === 0 && <p role="status">{emptyLabel}</p>}
        </div>
        <Button variant="ghost" onClick={() => onChange([])} disabled={value.length === 0}>
          {clearLabel}
        </Button>
      </div>
    </Popover>
  );
}
