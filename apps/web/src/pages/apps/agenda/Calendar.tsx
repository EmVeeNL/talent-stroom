/* oxlint-disable react/no-unstable-nested-components -- render props of ui components (Dialog footer) */
import { z } from "zod";
import { useAppForm, FormSummary, submitForm } from "../../../forms.tsx";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button, Dialog, Icon, ViewSwitcher } from "@talentstroom/ui";
import type { IconName } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { AGENDA_EVENTS, DEMO_TODAY } from "../../../demo/apps.ts";
import type { AgendaEvent, AgendaEventType } from "../../../demo/apps.ts";
import { addDays, addMonths, fromIso, monthWeeks, sameMonth, weekDays } from "./dates.ts";
import "./calendar.css";

type CalendarView = "month" | "week";

const TYPES: readonly { id: AgendaEventType; icon: IconName }[] = [
  { id: "gesprek", icon: "handshake" },
  { id: "intake", icon: "assignment" },
  { id: "deadline", icon: "schedule" },
];
const iconFor = (type: AgendaEventType): IconName => TYPES.find((entry) => entry.id === type)?.icon ?? "event";
const TYPE_KEYS: Record<AgendaEventType, MessageKey> = {
  gesprek: "demo.apps.agenda.type.gesprek",
  intake: "demo.apps.agenda.type.intake",
  deadline: "demo.apps.agenda.type.deadline",
};

export function sortEvents(events: readonly AgendaEvent[]): AgendaEvent[] {
  return events.toSorted((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || a.title.localeCompare(b.title));
}

interface Draft {
  title: string;
  type: AgendaEventType;
  date: string;
  start: string;
  end: string;
}

const emptyDraft = (date: string): Draft => ({ title: "", type: "gesprek", date, start: "09:00", end: "10:00" });

const schema = z
  .object({
    title: z.string().trim().min(1),
    type: z.enum(["gesprek", "intake", "deadline"]),
    date: z.iso.date(),
    start: z.string(),
    end: z.string(),
  })
  .superRefine((value, context) => {
    if (
      value.type !== "deadline" &&
      (!/^\d{2}:\d{2}$/.test(value.start) || !/^\d{2}:\d{2}$/.test(value.end) || value.end <= value.start)
    )
      context.addIssue({ code: "custom", path: ["end"], message: "time" });
  });

export function Calendar({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const [events, setEvents] = useState<readonly AgendaEvent[]>(AGENDA_EVENTS);
  const [view, setView] = useState<CalendarView>("month");
  const [focus, setFocus] = useState(DEMO_TODAY);
  const [open, setOpen] = useState(false);

  const [status, setStatus] = useState("");
  const grid = useRef<HTMLTableElement>(null);
  const moved = useRef(false);
  const formId = useId();

  const fmt = (options: Intl.DateTimeFormatOptions, iso: string) =>
    new Intl.DateTimeFormat(locale, options).format(fromIso(iso));
  const weeks = view === "month" ? monthWeeks(focus) : [weekDays(focus)];
  const period =
    view === "month"
      ? fmt({ month: "long", year: "numeric" }, focus)
      : `${fmt({ day: "numeric", month: "short" }, weeks[0]?.[0] ?? focus)} – ${fmt({ day: "numeric", month: "short", year: "numeric" }, weeks[0]?.[6] ?? focus)}`;
  const eventsOn = (iso: string) => sortEvents(events.filter((event) => event.date === iso));
  const count = (n: number) => tr(n === 1 ? "demo.apps.agenda.count_one" : "demo.apps.agenda.count_many", { count: n });
  const timeLabel = (event: AgendaEvent) =>
    event.start ? `${event.start}${event.end ? `–${event.end}` : ""}` : tr("demo.apps.agenda.all_day");

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-date="${focus}"]`)?.focus();
  }, [focus]);

  const go = (iso: string) => {
    moved.current = true;
    setFocus(iso);
  };
  const step = (direction: 1 | -1) =>
    setFocus(view === "month" ? addMonths(focus, direction) : addDays(focus, 7 * direction));

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const keys: Record<string, string> = {
      ArrowLeft: addDays(focus, -1),
      ArrowRight: addDays(focus, 1),
      ArrowUp: addDays(focus, -7),
      ArrowDown: addDays(focus, 7),
      PageUp: addMonths(focus, -1),
      PageDown: addMonths(focus, 1),
      Home: weekDays(focus)[0] ?? focus,
      End: weekDays(focus)[6] ?? focus,
    };
    const next = keys[event.key];
    if (!next) return;
    event.preventDefault();
    go(next);
  };

  const openDialog = () => {
    form.reset(emptyDraft(focus));
    setOpen(true);
  };

  const form = useAppForm({
    defaultValues: emptyDraft(DEMO_TODAY),
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      const draft = schema.parse(value);
      const title = draft.title;
      const allDay = draft.type === "deadline";
      const created: AgendaEvent = {
        id: `ev-new-${events.length + 1}`,
        title,
        date: draft.date,
        type: draft.type,
        ...(allDay ? {} : { start: draft.start, end: draft.end }),
      };
      setEvents([...events, created]);
      setFocus(draft.date);
      setStatus(tr("demo.apps.agenda.added", { title, date: fmt({ day: "numeric", month: "long" }, draft.date) }));
      setOpen(false);
    },
  });

  const dayEvents = eventsOn(focus);

  return (
    <div className="ag">
      <div className="ag__toolbar">
        <div className="ag__nav">
          <Button
            variant="outline"
            icon="chevron_left"
            aria-label={tr(view === "month" ? "demo.apps.agenda.previous_month" : "demo.apps.agenda.previous_week")}
            onClick={() => step(-1)}
          />
          <Button
            variant="outline"
            icon="chevron_right"
            aria-label={tr(view === "month" ? "demo.apps.agenda.next_month" : "demo.apps.agenda.next_week")}
            onClick={() => step(1)}
          />
          <Button variant="outline" onClick={() => setFocus(DEMO_TODAY)}>
            {tr("demo.apps.agenda.today")}
          </Button>
          <h2 className="ag__period" aria-live="polite">
            {period}
          </h2>
        </div>
        <div className="ag__actions">
          <ViewSwitcher
            label={tr("demo.apps.agenda.view")}
            value={view}
            onChange={(value) => setView(value === "week" ? "week" : "month")}
            options={[
              { value: "month", label: tr("demo.apps.agenda.view_month"), icon: "calendar_month" },
              { value: "week", label: tr("demo.apps.agenda.view_week"), icon: "view_kanban" },
            ]}
          />
          <Button icon="add" onClick={openDialog}>
            {tr("demo.apps.agenda.new")}
          </Button>
        </div>
      </div>

      <ul className="ag__legend" aria-label={tr("demo.apps.agenda.legend")}>
        {TYPES.map((type) => (
          <li key={type.id} className={`ag-chip ag-chip--${type.id}`}>
            <Icon name={type.icon} size={16} />
            {tr(TYPE_KEYS[type.id])}
          </li>
        ))}
      </ul>

      <div className="ag__layout">
        <div className="ag__grid-wrap">
          <p className="ts-visually-hidden" id={`${formId}-hint`}>
            {tr("demo.apps.agenda.keyboard_hint")}
          </p>
          <table
            // The APG grid pattern on a table: rows and cells keep their table semantics.
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
            role="grid"
            ref={grid}
            className={`ag__grid ag__grid--${view}`}
            aria-label={tr("demo.apps.agenda.grid", { period })}
            aria-describedby={`${formId}-hint`}
            // The focusable gridcells receive the key events; the grid itself is not a tab stop.
            // oxlint-disable-next-line jsx-a11y/interactive-supports-focus
            onKeyDown={onGridKeyDown}
          >
            <thead>
              <tr className="ag__row ag__row--head">
                {weekDays(DEMO_TODAY).map((iso) => (
                  <th key={iso} scope="col" className="ag__weekday" abbr={fmt({ weekday: "long" }, iso)}>
                    {fmt({ weekday: "short" }, iso)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr className="ag__row" key={week[0]}>
                  {week.map((iso) => {
                    const list = eventsOn(iso);
                    const visible = view === "week" ? list : list.slice(0, 3);
                    const label = [
                      fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, iso),
                      list.length === 0 ? tr("demo.apps.agenda.no_events") : count(list.length),
                      ...list.map((entry) => `${timeLabel(entry)} ${entry.title}, ${tr(TYPE_KEYS[entry.type])}`),
                    ].join(", ");
                    return (
                      // Arrow keys are handled on the grid; a click only selects the day.
                      // oxlint-disable-next-line jsx-a11y/click-events-have-key-events
                      <td
                        key={iso}
                        // Explicit for assistive technology that does not map td to gridcell inside a grid.
                        // oxlint-disable-next-line jsx-a11y/no-redundant-roles
                        role="gridcell"
                        tabIndex={iso === focus ? 0 : -1}
                        aria-label={label}
                        aria-selected={iso === focus}
                        aria-current={iso === DEMO_TODAY ? "date" : undefined}
                        data-date={iso}
                        data-outside={view === "month" && !sameMonth(iso, focus) ? "" : undefined}
                        data-today={iso === DEMO_TODAY ? "" : undefined}
                        className="ag__cell"
                        onClick={() => setFocus(iso)}
                      >
                        <span className="ag__day" aria-hidden="true">
                          {fromIso(iso).getDate()}
                        </span>
                        <ul className="ag__events" aria-hidden="true">
                          {visible.map((entry) => (
                            <li key={entry.id} className={`ag-chip ag-chip--${entry.type}`}>
                              <Icon name={iconFor(entry.type)} size={16} />
                              <span className="ag-chip__text">
                                {view === "week" && entry.start && (
                                  <span className="ag-chip__time">{entry.start} </span>
                                )}
                                {entry.title}
                              </span>
                            </li>
                          ))}
                          {list.length > visible.length && (
                            <li className="ag__more">+{list.length - visible.length}</li>
                          )}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="ag__day-panel" aria-labelledby={`${formId}-day`}>
          <h3 id={`${formId}-day`}>
            {tr("demo.apps.agenda.day_panel", { date: fmt({ weekday: "long", day: "numeric", month: "long" }, focus) })}
          </h3>
          {dayEvents.length === 0 ? (
            <p className="ag__empty">{tr("demo.apps.agenda.no_events")}</p>
          ) : (
            <ul className="ag__day-list">
              {dayEvents.map((entry) => (
                <li key={entry.id} className={`ag-item ag-item--${entry.type}`}>
                  <Icon name={iconFor(entry.type)} size={20} />
                  <div>
                    <p className="ag-item__title">{entry.title}</p>
                    <p className="ag-item__meta">
                      {timeLabel(entry)} · {tr(TYPE_KEYS[entry.type])}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <output className="ts-visually-hidden" aria-live="polite">
        {status}
      </output>

      <Dialog
        title={tr("demo.apps.agenda.form.title")}
        triggerLabel={tr("demo.apps.agenda.new")}
        closeLabel={tr("demo.apps.agenda.form.close")}
        hideTrigger
        open={open}
        onOpenChange={setOpen}
        footer={(close) => (
          <>
            <Button variant="outline" onClick={close}>
              {tr("demo.apps.agenda.form.cancel")}
            </Button>
            <Button type="submit" form={formId}>
              {tr("demo.apps.agenda.form.save")}
            </Button>
          </>
        )}
      >
        <form.AppForm>
          <form
            id={formId}
            className="ag-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForm(form);
            }}
            noValidate
          >
            <FormSummary
              locale={locale}
              fields={{
                title: { id: `${formId}-title`, label: tr("demo.apps.agenda.form.name") },
                date: { id: `${formId}-date`, label: tr("demo.apps.agenda.form.date") },
                end: { id: `${formId}-end`, label: tr("demo.apps.agenda.form.end") },
              }}
            />
            <form.AppField name="title">
              {(field) => (
                <field.Text locale={locale} id={`${formId}-title`} label={tr("demo.apps.agenda.form.name")} required />
              )}
            </form.AppField>
            <form.AppField name="type">
              {(field) => (
                <field.Choice locale={locale} label={tr("demo.apps.agenda.form.type")}>
                  {TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {tr(TYPE_KEYS[type.id])}
                    </option>
                  ))}
                </field.Choice>
              )}
            </form.AppField>
            <form.AppField name="date">
              {(field) => (
                <field.Text
                  locale={locale}
                  id={`${formId}-date`}
                  label={tr("demo.apps.agenda.form.date")}
                  type="date"
                  required
                />
              )}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.type}>
              {(type) =>
                type !== "deadline" && (
                  <div className="ag-form__times">
                    <form.AppField name="start">
                      {(field) => <field.Text locale={locale} label={tr("demo.apps.agenda.form.start")} type="time" />}
                    </form.AppField>
                    <form.AppField name="end">
                      {(field) => (
                        <field.Text
                          locale={locale}
                          id={`${formId}-end`}
                          label={tr("demo.apps.agenda.form.end")}
                          type="time"
                        />
                      )}
                    </form.AppField>
                  </div>
                )
              }
            </form.Subscribe>
          </form>
        </form.AppForm>
      </Dialog>
    </div>
  );
}
