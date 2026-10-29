import { useState } from "react";
import { SearchInput, Combobox, DateRangePicker, FacetedFilter, ViewSwitcher } from "@talentstroom/ui";
import type { DateRange } from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
export function Filters() {
  const { tr, locale } = useGallery();
  const [single, setSingle] = useState<string[]>([]),
    [multi, setMulti] = useState<string[]>(["tech"]),
    [status, setStatus] = useState<string[]>(["new"]),
    [view, setView] = useState("table"),
    [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 29) });
  const options = [
    { value: "tech", label: tr("gallery.data.tag.tech") },
    { value: "finance", label: tr("gallery.data.tag.finance") },
    { value: "hr", label: tr("gallery.data.tag.hr") },
  ];
  return (
    <>
      <Section title={tr("gallery.filters.search")}>
        <SearchInput
          label={tr("gallery.filters.search")}
          clearLabel={tr("gallery.filters.clear")}
          placeholder={tr("gallery.filters.searchHint")}
          searchLandmark
        />
        <SearchInput
          label={tr("gallery.filters.disabled")}
          clearLabel={tr("gallery.filters.clear")}
          disabled
          defaultValue={tr("gallery.data.sam")}
        />
      </Section>
      <Section title={tr("gallery.filters.combobox")}>
        <Combobox
          label={tr("gallery.filters.single")}
          options={[
            { value: "one", label: tr("gallery.filters.client1") },
            { value: "two", label: tr("gallery.filters.client2") },
            { value: "three", label: tr("gallery.filters.client3"), disabled: true },
          ]}
          value={single}
          onChange={setSingle}
          emptyLabel={tr("gallery.filters.noOptions")}
          removeLabel={(n) => tr("gallery.filters.remove").replace("{name}", n)}
        />
        <Combobox
          label={tr("gallery.filters.multi")}
          options={options}
          value={multi}
          onChange={setMulti}
          multiple
          emptyLabel={tr("gallery.filters.noOptions")}
          removeLabel={(n) => tr("gallery.filters.remove").replace("{name}", n)}
        />
        <Combobox
          label={tr("gallery.filters.disabled")}
          options={options}
          value={["tech"]}
          onChange={() => {}}
          disabled
          emptyLabel={tr("gallery.filters.noOptions")}
          removeLabel={(n) => tr("gallery.filters.remove").replace("{name}", n)}
        />
      </Section>
      <Section title={tr("gallery.filters.dates")}>
        <DateRangePicker
          label={tr("gallery.filters.range")}
          value={range}
          onChange={setRange}
          locale={locale}
          today={new Date(2026, 9, 29)}
          labels={{
            previous: tr("gallery.filters.previousMonth"),
            next: tr("gallery.filters.nextMonth"),
            today: tr("gallery.filters.today"),
            last7: tr("gallery.filters.last7"),
            month: tr("gallery.filters.month"),
            hint: tr("gallery.filters.dateHint"),
            start: tr("gallery.filters.dateStart"),
            complete: tr("gallery.filters.dateComplete"),
          }}
        />
        <DateRangePicker
          label={tr("gallery.filters.disabled")}
          disabled
          onChange={() => {}}
          labels={{
            previous: tr("gallery.filters.previousMonth"),
            next: tr("gallery.filters.nextMonth"),
            today: tr("gallery.filters.today"),
            last7: tr("gallery.filters.last7"),
            month: tr("gallery.filters.month"),
            hint: tr("gallery.filters.range"),
            start: tr("gallery.filters.dateStart"),
            complete: tr("gallery.filters.dateComplete"),
          }}
        />
      </Section>
      <Section title={tr("gallery.filters.facets")}>
        <FacetedFilter
          label={tr("gallery.filters.status")}
          searchLabel={tr("gallery.filters.searchOptions")}
          clearLabel={tr("gallery.filters.clear")}
          emptyLabel={tr("gallery.filters.noOptions")}
          options={[
            { value: "new", label: tr("gallery.data.status.new"), count: 5 },
            { value: "active", label: tr("gallery.data.status.active"), count: 8 },
            { value: "placed", label: tr("gallery.data.status.placed"), count: 3 },
          ]}
          value={status}
          onChange={setStatus}
        />
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
      </Section>
    </>
  );
}
