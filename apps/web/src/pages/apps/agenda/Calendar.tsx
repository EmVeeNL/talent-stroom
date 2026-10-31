import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
  ContextMenu,
  FormDialog,
  Icon,
  LayoutGroup,
  MotionLayout,
  Select,
  DetailDrawer,
  m,
  useReducedMotion,
  ViewSwitcher,
} from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { AGENDA_USERS, DEMO_TODAY } from "../../../demo/apps.ts";
import type { AgendaEvent } from "../../../demo/apps.ts";
import { demoStore, useDemoStore } from "../../../demo/store.ts";
import { addDays, addMonths, fromIso, monthWeeks, sameMonth, toIso, weekDays } from "./dates.ts";
import {
  clock,
  draftFor,
  minutes,
  occursOn,
  layoutDay,
  parseScope,
  resizeEvent,
  scopeSearch,
  scopedEvents,
  shiftEvent,
} from "./agenda.ts";
import type { AgendaScope, Appointment, AppointmentDraft, ScopedAppointment } from "./agenda.ts";
import { AppointmentForm } from "./AppointmentForm.tsx";
import "./calendar.css";

type CalendarView = "month" | "week" | "day";
interface Modal {
  mode: "detail" | "edit" | "new" | "move" | "delete";
  id: string;
  draft: AppointmentDraft;
}
export const sortEvents = (events: readonly AgendaEvent[]) =>
  events.toSorted((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || a.title.localeCompare(b.title));
const slotFor = (start: string, allDay: boolean, timed: boolean) =>
  timed && !allDay ? Math.floor(minutes(start) / 15) : -1;
const targetKey = (date: string, slot: number) => `${date}|${slot}`;
const personIndex = (event: Appointment) => AGENDA_USERS.findIndex((user) => user.id === event.organiser);
const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");
const TYPE_KEYS = {
  gesprek: "demo.apps.agenda.type.gesprek",
  intake: "demo.apps.agenda.type.intake",
  deadline: "demo.apps.agenda.type.deadline",
} as const;

export function Calendar({ locale }: { locale: Locale }) {
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const { events, tasks } = useDemoStore();
  const [scope, setScopeState] = useState<AgendaScope>(() => parseScope(window.location.search));
  const [people, setPeople] = useState<string[]>(() => AGENDA_USERS.map((user) => user.id));
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const visible = scopedEvents(events, scope, people, tr("demo.apps.agenda.busy"));
  const [view, setView] = useState<CalendarView>("month");
  const [focus, setFocus] = useState(DEMO_TODAY);
  const [slot, setSlot] = useState(-1);
  const [modal, setModal] = useState<Modal | null>(null);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(() => new Date());
  const grid = useRef<HTMLTableElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const modalBody = useRef<HTMLDivElement>(null);
  const sheetBody = useRef<HTMLDivElement>(null);
  const modalRef = useRef<Modal | null>(null);
  const targetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveFocus = useRef(false);
  const drag = useRef<{ id: string; resize: boolean } | null>(null);
  const reduced = useReducedMotion();
  const id = useId();
  const fmt = (
    iso: string,
    options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  ) => new Intl.DateTimeFormat(locale, options).format(fromIso(iso));
  const days = view === "day" ? [focus] : weekDays(focus);
  const weeks = view === "month" ? monthWeeks(focus) : [days];
  const segmentsByDay = new Map(days.map((date) => [date, layoutDay(visible, date)]));
  const period =
    view === "month"
      ? fmt(focus, { month: "long", year: "numeric" })
      : view === "day"
        ? fmt(focus)
        : `${fmt(days[0] ?? focus, { day: "numeric", month: "short" })} – ${fmt(days[6] ?? focus, { day: "numeric", month: "short", year: "numeric" })}`;
  const on = (date: string) =>
    visible
      .filter((event) => occursOn(event, date))
      .toSorted((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
  const timeLabel = (event: Appointment) =>
    event.allDay ? tr("demo.apps.agenda.all_day") : `${event.start}–${event.end}`;
  const rangeLabel = (event: Appointment) =>
    `${fmt(event.date)}${event.endDate !== event.date ? ` – ${fmt(event.endDate)}` : ""}, ${timeLabel(event)}`;
  const selected = modal ? events.find((event) => event.id === modal.id) : undefined;
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 7 * 48;
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- scroll only when the view changes
  }, [view]);
  useEffect(() => {
    if (moveFocus.current) {
      moveFocus.current = false;
      grid.current?.querySelector<HTMLElement>(`[data-date="${focus}"][data-slot="${slot}"]`)?.focus();
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- focus only follows date/slot navigation
  }, [focus, slot]);
  useLayoutEffect(() => {
    modalRef.current = modal;
  }, [modal]);
  useEffect(() => () => clearTimeout(targetTimer.current), []);
  useEffect(() => {
    if (!modal) return;
    const dialog = (modal.mode === "detail" ? sheetBody : modalBody).current?.closest("dialog");
    if (!dialog) return;
    if (modal.mode === "detail") {
      const heading = dialog.querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    } else {
      dialog
        .querySelector<HTMLElement>(modal.mode === "delete" ? ".ag-form__footer button" : '[name="title"]')
        ?.focus();
    }
  }, [modal]);
  const previewTarget = useCallback(
    (target: { date: string; start: string; allDay: boolean } | null) =>
      setDropTarget(target ? targetKey(target.date, slotFor(target.start, target.allDay, view !== "month")) : null),
    [view],
  );
  const close = () => {
    setModal(null);
    requestAnimationFrame(() => {
      if (opener.current?.isConnected) opener.current.focus();
      else grid.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    });
  };
  const open = (event?: Appointment, mode: Modal["mode"] = "detail", date = focus, minute?: number) => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setModal({
      mode: event ? mode : "new",
      id: event?.id ?? crypto.randomUUID(),
      draft: event ?? {
        ...draftFor(date, clock(minute === undefined || minute < 0 ? 9 * 60 : minute)),
        allDay: minute === -1,
      },
    });
  };
  const announceMove = (event: Appointment, keyboard = false) => {
    demoStore.save(event);
    if (keyboard) {
      setDropTarget(targetKey(event.date, slotFor(event.start, event.allDay, view !== "month")));
      clearTimeout(targetTimer.current);
      targetTimer.current = setTimeout(() => setDropTarget(null), 1500);
    }
    setFocus(event.date);
    requestAnimationFrame(() => {
      const targets = document.querySelectorAll<HTMLButtonElement>(`[data-event-id="${event.id}"]`);
      Array.from(targets)
        .find((target) => target.getClientRects().length > 0)
        ?.focus();
    });
    setStatus(tr("demo.apps.agenda.moved", { title: event.title, date: fmt(event.date), time: timeLabel(event) }));
  };
  const moveKey = (key: KeyboardEvent<HTMLButtonElement>, event: Appointment) => {
    if (!key.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key.key)) return;
    key.preventDefault();
    key.stopPropagation();
    announceMove(
      shiftEvent(
        event,
        key.key === "ArrowLeft" ? -1 : key.key === "ArrowRight" ? 1 : 0,
        key.key === "ArrowUp" ? -15 : key.key === "ArrowDown" ? 15 : 0,
      ),
      true,
    );
  };
  const drop = (event: DragEvent<HTMLTableCellElement>, date: string, minute?: number) => {
    event.preventDefault();
    const dragged = drag.current;
    drag.current = null;
    setDropTarget(null);
    const item = events.find((entry) => entry.id === dragged?.id);
    if (!item || !dragged) return;
    if (dragged.resize && minute !== undefined) {
      announceMove(resizeEvent(item, date, minute + 15));
      return;
    }
    const deltaDays = Math.round((Date.UTC(...dateParts(date)) - Date.UTC(...dateParts(item.date))) / 86_400_000);
    announceMove(shiftEvent(item, deltaDays, minute !== undefined && !item.allDay ? minute - minutes(item.start) : 0));
  };
  const gridKey = (key: KeyboardEvent<HTMLTableCellElement>, date: string, index: number) => {
    if (key.target !== key.currentTarget) return;
    if (key.key === "Enter") {
      key.preventDefault();
      open(undefined, "new", date, index < 0 ? (view === "month" ? undefined : -1) : index * 15);
      return;
    }
    let next = date,
      nextSlot = index;
    if (key.key === "ArrowLeft") next = addDays(date, -1);
    else if (key.key === "ArrowRight") next = addDays(date, 1);
    else if (key.key === "ArrowUp") {
      if (view === "month") next = addDays(date, -7);
      else nextSlot = Math.max(-1, index - 1);
    } else if (key.key === "ArrowDown") {
      if (view === "month") next = addDays(date, 7);
      else nextSlot = Math.min(95, index + 1);
    } else if (key.key === "Home") {
      if (view === "month") next = weekDays(date)[0] ?? date;
      else nextSlot = -1;
    } else if (key.key === "End") {
      if (view === "month") next = weekDays(date)[6] ?? date;
      else nextSlot = 95;
    } else if (key.key === "PageUp" || key.key === "PageDown") next = addMonths(date, key.key === "PageUp" ? -1 : 1);
    else return;
    key.preventDefault();
    moveFocus.current = true;
    setFocus(next);
    setSlot(nextSlot);
  };
  const item = (
    event: ScopedAppointment,
    context: string,
    style?: { height?: number; width?: string; left?: string; top?: number },
    resize = false,
  ) =>
    event.busy ? (
      <m.div
        key={event.id}
        className={`ag-entry ag-entry--busy${personClass(event)}${style ? " ag-entry--positioned" : ""}`}
        {...(style ? { style } : {})}
      >
        <span className="ag-entry__open">
          <span className="ag-entry__time">{timeLabel(event)} </span>
          <span>{event.title}</span>
          {who(event)}
        </span>
      </m.div>
    ) : (
      <m.div
        key={event.id}
        layout={!reduced}
        {...(!reduced ? { layoutId: `${id}-${context === event.date ? "calendar" : context}-${event.id}` } : {})}
        transition={{ duration: reduced ? 0 : 0.18 }}
        className={`ag-entry ag-chip--${event.type}${personClass(event)}${style ? " ag-entry--positioned" : ""}`}
        {...(style ? { style } : {})}
      >
        <button
          type="button"
          className="ag-entry__open"
          data-event-id={event.id}
          draggable
          aria-describedby={`${id}-hint`}
          onDragStart={(e) => {
            drag.current = { id: event.id, resize: false };
            e.dataTransfer.setData("text/plain", event.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            drag.current = null;
            setDropTarget(null);
          }}
          onClick={(e) => {
            e.stopPropagation();
            open(event);
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => moveKey(e, event)}
        >
          <span className="ag-entry__time">{timeLabel(event)} </span>
          <span>{event.title}</span>
          {who(event)}
        </button>
        <ContextMenu
          triggerLabel={tr("demo.apps.agenda.actions", { title: event.title })}
          items={[
            { id: "edit", label: tr("demo.apps.agenda.edit"), onSelect: () => open(event, "edit") },
            { id: "move", label: tr("demo.apps.agenda.move"), onSelect: () => open(event, "move") },
            { id: "task", label: tr("demo.apps.agenda.task"), onSelect: () => makeTask(event) },
            {
              id: "delete",
              label: tr("demo.apps.agenda.delete"),
              tone: "danger",
              onSelect: () => open(event, "delete"),
            },
          ]}
        />
        {resize && (
          <button
            type="button"
            draggable
            className="ag-entry__resize"
            aria-label={tr("demo.apps.agenda.resize", { title: event.title })}
            onClick={() => open(event, "edit")}
            onDragStart={(e) => {
              e.stopPropagation();
              drag.current = { id: event.id, resize: true };
              e.dataTransfer.setData("text/plain", event.id);
            }}
            onDragEnd={() => {
              drag.current = null;
              setDropTarget(null);
            }}
          />
        )}
      </m.div>
    );
  const personClass = (event: Appointment) =>
    scope.kind === "shared" && personIndex(event) >= 0 ? ` ag-person--${personIndex(event)}` : "";
  const who = (event: Appointment) => {
    const name = AGENDA_USERS[personIndex(event)]?.name;
    return scope.kind === "shared" && name ? (
      <>
        <span className="ag-entry__who" aria-hidden="true">
          {initials(name)}
        </span>
        <span className="ts-visually-hidden"> ({name})</span>
      </>
    ) : null;
  };
  const makeTask = (event: Appointment) => {
    demoStore.taskFrom(event, tr("demo.apps.agenda.task_title", { title: event.title }));
    setStatus(tr("demo.apps.agenda.task_added"));
  };
  const cellProps = (date: string, index: number) => ({
    role: "gridcell",
    tabIndex: date === focus && index === slot ? 0 : -1,
    "data-date": date,
    "data-slot": index,
    "aria-selected": date === focus && index === slot,
    "aria-describedby": dropTarget === targetKey(date, index) ? `${id}-drop` : `${id}-hint`,
    "data-drop-target": dropTarget === targetKey(date, index) ? "" : undefined,
    onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => gridKey(event, date, index),
    onClick: () => {
      setFocus(date);
      setSlot(index);
    },
    onDoubleClick: (event: MouseEvent<HTMLTableCellElement>) => {
      if (!(event.target instanceof Element) || event.target.closest("button")) return;
      open(undefined, "new", date, index < 0 ? (view === "month" ? undefined : -1) : index * 15);
    },
    onDragEnter: (event: DragEvent<HTMLTableCellElement>) => {
      if (!drag.current) return;
      event.preventDefault();
      setDropTarget(targetKey(date, index));
    },
    onDragOver: (event: DragEvent<HTMLTableCellElement>) => {
      event.preventDefault();
      if (drag.current) setDropTarget(targetKey(date, index));
    },
    onDragLeave: (event: DragEvent<HTMLTableCellElement>) => {
      if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
      setDropTarget((current) => (current === targetKey(date, index) ? null : current));
    },
    onDrop: (event: DragEvent<HTMLTableCellElement>) => drop(event, date, index < 0 ? undefined : index * 15),
  });
  return (
    <MotionLayout>
      <LayoutGroup id={id}>
        <div className="ag">
          <div className="ag__toolbar">
            <div className="ag__nav">
              <Button
                variant="outline"
                icon="chevron_left"
                aria-label={tr(
                  view === "month"
                    ? "demo.apps.agenda.previous_month"
                    : view === "week"
                      ? "demo.apps.agenda.previous_week"
                      : "demo.apps.agenda.previous_day",
                )}
                onClick={() =>
                  setFocus(view === "month" ? addMonths(focus, -1) : addDays(focus, view === "week" ? -7 : -1))
                }
              />
              <Button
                variant="outline"
                icon="chevron_right"
                aria-label={tr(
                  view === "month"
                    ? "demo.apps.agenda.next_month"
                    : view === "week"
                      ? "demo.apps.agenda.next_week"
                      : "demo.apps.agenda.next_day",
                )}
                onClick={() =>
                  setFocus(view === "month" ? addMonths(focus, 1) : addDays(focus, view === "week" ? 7 : 1))
                }
              />
              <Button variant="outline" onClick={() => setFocus(DEMO_TODAY)}>
                {tr("demo.apps.agenda.today")}
              </Button>
              <h2 className="ag__period" aria-live="polite">
                {period}
              </h2>
            </div>
            <div className="ag__actions">
              <Select
                className="ag__selector"
                label={tr("demo.apps.agenda.selector")}
                value={scope.kind === "member" ? scope.id : scope.kind}
                onChange={(event) => {
                  const value = event.target.value;
                  const next: AgendaScope =
                    value === "shared"
                      ? { kind: "shared" }
                      : AGENDA_USERS.some((user) => user.id === value && value !== "u-eva")
                        ? { kind: "member", id: value }
                        : { kind: "me" };
                  setScopeState(next);
                  window.history.replaceState(
                    window.history.state,
                    "",
                    `${window.location.pathname}${scopeSearch(next, window.location.search)}${window.location.hash}`,
                  );
                }}
              >
                <option value="me">{tr("demo.apps.agenda.mine")}</option>
                {AGENDA_USERS.filter((user) => user.id !== "u-eva").map((user) => (
                  <option key={user.id} value={user.id}>
                    {tr("demo.apps.agenda.agenda_of", { name: user.name })}
                  </option>
                ))}
                <option value="shared">{tr("demo.apps.agenda.shared")}</option>
              </Select>
              <ViewSwitcher
                label={tr("demo.apps.agenda.view")}
                value={view}
                onChange={(value) => {
                  setView(value === "day" ? "day" : value === "week" ? "week" : "month");
                  setSlot(-1);
                }}
                options={[
                  { value: "month", label: tr("demo.apps.agenda.view_month"), icon: "calendar_month" },
                  { value: "week", label: tr("demo.apps.agenda.view_week"), icon: "view_kanban" },
                  { value: "day", label: tr("demo.apps.agenda.view_day"), icon: "schedule" },
                ]}
              />
              <Button icon="add" onClick={() => open()}>
                {tr("demo.apps.agenda.new")}
              </Button>
            </div>
          </div>
          <ul className="ag__legend" aria-label={tr("demo.apps.agenda.legend")}>
            {(["gesprek", "intake", "deadline"] as const).map((type) => (
              <li key={type} className={`ag-chip ag-chip--${type}`}>
                <Icon
                  name={type === "gesprek" ? "handshake" : type === "intake" ? "assignment" : "schedule"}
                  size={16}
                />
                {tr(TYPE_KEYS[type])}
              </li>
            ))}
          </ul>
          {scope.kind === "shared" && (
            <CheckboxGroup legend={tr("demo.apps.agenda.people")} className="ag__people">
              {AGENDA_USERS.map((user, index) => (
                <Checkbox
                  key={user.id}
                  className={`ag-person-check ag-person--${index}`}
                  label={user.name}
                  checked={people.includes(user.id)}
                  onChange={(event) =>
                    setPeople((current) =>
                      event.target.checked ? [...current, user.id] : current.filter((value) => value !== user.id),
                    )
                  }
                />
              ))}
            </CheckboxGroup>
          )}
          <p className="ts-visually-hidden" id={`${id}-hint`}>
            {tr("demo.apps.agenda.interaction_hint")}
          </p>
          <div className={`ag__layout ag__layout--${view}`}>
            <div className={`ag__grid-wrap ${view !== "month" ? "ag__desktop-time" : ""}`}>
              <div className={view === "month" ? "" : "ag__time-scroll"} ref={scroll}>
                {/* APG grid: focus belongs to cells; native table row/cell roles are retained. */}
                <table
                  // APG interactive calendar grid on native table rows.
                  // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
                  role="grid"
                  ref={(node) => {
                    grid.current = node;
                    node?.style.setProperty("--ag-columns", String(view === "day" ? 1 : 7));
                  }}
                  className={`ag__grid ag__grid--${view}`}
                  aria-label={tr("demo.apps.agenda.grid", { period })}
                  aria-describedby={`${id}-hint`}
                >
                  <thead>
                    <tr className="ag__row ag__row--head">
                      {view !== "month" && (
                        <th scope="col" className="ag__weekday">
                          {tr("demo.apps.agenda.start_time")}
                        </th>
                      )}
                      {(view === "month" ? weekDays(focus) : days).map((date) => (
                        <th scope="col" className="ag__weekday" key={date}>
                          {fmt(
                            date,
                            view === "month"
                              ? { weekday: "short" }
                              : { weekday: "short", day: "numeric", month: "short" },
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week) => (
                      <tr className={`ag__row ${view !== "month" ? "ag__all-day" : ""}`} key={week[0]}>
                        {view !== "month" && (
                          <th scope="row" className="ag__weekday">
                            {tr("demo.apps.agenda.all_day")}
                          </th>
                        )}
                        {week.map((date) => {
                          const entries = on(date).filter((event) => view === "month" || event.allDay);
                          return (
                            <td
                              key={date}
                              {...cellProps(date, -1)}
                              aria-label={[
                                fmt(date),
                                ...entries.map((event) => `${timeLabel(event)} ${event.title}`),
                              ].join(", ")}
                              aria-current={date === DEMO_TODAY ? "date" : undefined}
                              data-outside={view === "month" && !sameMonth(date, focus) ? "" : undefined}
                              data-today={date === DEMO_TODAY ? "" : undefined}
                              className="ag__cell"
                            >
                              {view === "month" && (
                                <span className="ag__day" aria-hidden="true">
                                  {fromIso(date).getDate()}
                                </span>
                              )}
                              <div className="ag__events">{entries.map((event) => item(event, date))}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {view !== "month" &&
                      Array.from({ length: 96 }, (_, index) => (
                        <tr className="ag__row ag__time-row" key={index}>
                          <th scope="row" className="ag__hour">
                            {index % 4 === 0 ? (
                              clock(index * 15)
                            ) : (
                              <span className="ts-visually-hidden">{clock(index * 15)}</span>
                            )}
                          </th>
                          {days.map((date) => {
                            const segments = segmentsByDay.get(date) ?? [];
                            const current =
                              toIso(now) === date &&
                              Math.floor((now.getHours() * 60 + now.getMinutes()) / 15) === index;
                            return (
                              <td
                                key={date}
                                {...cellProps(date, index)}
                                className="ag__time-cell"
                                data-hour={index % 4 === 0 ? "" : undefined}
                                aria-label={`${fmt(date)}, ${clock(index * 15)}`}
                              >
                                {segments
                                  .filter((segment) => Math.floor(segment.start / 15) === index)
                                  .map(({ event, start, end, lane, lanes }) =>
                                    item(
                                      event,
                                      date,
                                      {
                                        height: Math.max(24, (end - start) * 0.8),
                                        width: `${100 / lanes}%`,
                                        left: `${(lane * 100) / lanes}%`,
                                        top: (start % 15) * 0.8,
                                      },
                                      true,
                                    ),
                                  )}
                                {current && (
                                  <>
                                    <span
                                      className="ag__now"
                                      style={{ top: (now.getMinutes() % 15) * 0.8 }}
                                      aria-hidden="true"
                                    />
                                    <span className="ts-visually-hidden">
                                      {tr("demo.apps.agenda.current_time", {
                                        time: clock(now.getHours() * 60 + now.getMinutes()),
                                      })}
                                    </span>
                                  </>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <aside
              className={`ag__day-panel ${view !== "month" ? "ag__mobile-day" : ""}`}
              aria-labelledby={`${id}-day`}
            >
              {view !== "month" && (
                <div className="ag__nav">
                  <Button
                    variant="outline"
                    icon="chevron_left"
                    aria-label={tr("demo.apps.agenda.previous_day")}
                    onClick={() => setFocus(addDays(focus, -1))}
                  />
                  <Button
                    variant="outline"
                    icon="chevron_right"
                    aria-label={tr("demo.apps.agenda.next_day")}
                    onClick={() => setFocus(addDays(focus, 1))}
                  />
                </div>
              )}
              <h3 id={`${id}-day`}>{fmt(focus, { weekday: "long", day: "numeric", month: "long" })}</h3>
              {on(focus).length ? (
                <div className="ag__day-list">{on(focus).map((event) => item(event, "list"))}</div>
              ) : (
                <p className="ag__empty">{tr("demo.apps.agenda.no_events")}</p>
              )}
            </aside>
          </div>
          <p className="ts-visually-hidden" id={`${id}-drop`}>
            {tr("demo.apps.agenda.drop_target")}
          </p>
          <output className="ts-visually-hidden" aria-live="polite">
            {status}
          </output>
          <DetailDrawer
            footer={null}
            hideTrigger
            open={modal?.mode === "detail"}
            onOpenChange={(value) => {
              if (!value && modalRef.current?.mode === "detail") close();
            }}
            title={selected?.title ?? tr("demo.apps.agenda.details")}
            triggerLabel={tr("demo.apps.agenda.details")}
            closeLabel={tr("demo.apps.agenda.form.close")}
          >
            <div ref={sheetBody}>
              {modal?.mode === "detail" && selected && (
                <div className="ag-detail">
                  <p className="ag-detail__time">
                    <Icon name="schedule" />
                    {rangeLabel(selected)}
                  </p>
                  <p>{selected.location || tr("demo.apps.agenda.no_location")}</p>
                  {selected.online && (
                    <p>
                      <a href={selected.link} target="_blank" rel="noreferrer">
                        {tr("demo.apps.agenda.link")}
                      </a>
                    </p>
                  )}
                  {selected.description && <p className="ag-detail__description">{selected.description}</p>}
                  <h3>{tr("demo.apps.agenda.attendees")}</h3>
                  <ul className="ag-detail__guests">
                    {selected.attendees.map((guest) => (
                      <li key={guest.userId}>
                        {AGENDA_USERS.find((user) => user.id === guest.userId)?.name}
                        <Badge>{tr(guest.required ? "demo.apps.agenda.required" : "demo.apps.agenda.optional")}</Badge>
                      </li>
                    ))}
                  </ul>
                  <p>
                    {tr("demo.apps.agenda.organiser")}:{" "}
                    {AGENDA_USERS.find((user) => user.id === selected.organiser)?.name}
                  </p>
                  {tasks.some((task) => task.appointmentId === selected.id) && (
                    <>
                      <h3>{tr("demo.apps.agenda.linked_tasks")}</h3>
                      <ul>
                        {tasks
                          .filter((task) => task.appointmentId === selected.id)
                          .map((task) => (
                            <li key={task.id}>{task.title}</li>
                          ))}
                      </ul>
                    </>
                  )}
                  <div className="ag-form__footer">
                    <Button
                      variant="outline"
                      onClick={() => setModal({ mode: "edit", id: selected.id, draft: selected })}
                    >
                      {tr("demo.apps.agenda.edit")}
                    </Button>
                    <Button variant="outline" onClick={() => makeTask(selected)}>
                      {tr("demo.apps.agenda.task")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setModal({ mode: "delete", id: selected.id, draft: selected })}
                    >
                      {tr("demo.apps.agenda.delete")}
                    </Button>
                    <Button variant="outline" onClick={close}>
                      {tr("demo.apps.agenda.form.close")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DetailDrawer>
          <FormDialog
            hideTrigger
            open={modal !== null && modal.mode !== "detail"}
            onOpenChange={(value) => {
              if (!value && modalRef.current && modalRef.current.mode !== "detail") close();
            }}
            title={
              modal?.mode === "new"
                ? tr("demo.apps.agenda.new")
                : modal?.mode === "edit"
                  ? tr("demo.apps.agenda.edit")
                  : modal?.mode === "move"
                    ? tr("demo.apps.agenda.move")
                    : modal?.mode === "delete"
                      ? tr("demo.apps.agenda.delete")
                      : tr("demo.apps.agenda.details")
            }
            triggerLabel={tr("demo.apps.agenda.new")}
            closeLabel={tr("demo.apps.agenda.form.close")}
            size="lg"
          >
            <div ref={modalBody}>
              {modal && ["new", "edit", "move"].includes(modal.mode) ? (
                <AppointmentForm
                  key={`${modal.id}-${modal.mode}`}
                  {...(modal.mode === "move" ? { onTarget: previewTarget } : {})}
                  locale={locale}
                  initial={modal.draft}
                  eventId={modal.id}
                  events={events}
                  onSave={(event) => {
                    demoStore.save(event);
                    setFocus(event.date);
                    setStatus(
                      modal.mode === "new"
                        ? tr("demo.apps.agenda.added", { title: event.title, date: fmt(event.date) })
                        : tr("demo.apps.agenda.saved"),
                    );
                    if (modal.mode === "new") close();
                    else setModal({ mode: "detail", id: event.id, draft: event });
                  }}
                  onCancel={() => (selected ? setModal({ mode: "detail", id: selected.id, draft: selected }) : close())}
                />
              ) : (
                selected &&
                (modal?.mode === "delete" ? (
                  <div className="ag-form">
                    <p>{tr("demo.apps.agenda.delete_hint")}</p>
                    <div className="ag-form__footer">
                      <Button
                        variant="outline"
                        onClick={() => setModal({ mode: "detail", id: selected.id, draft: selected })}
                      >
                        {tr("demo.apps.agenda.form.cancel")}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          demoStore.remove(selected.id);
                          setStatus(tr("demo.apps.agenda.deleted"));
                          close();
                        }}
                      >
                        {tr("demo.apps.agenda.confirm_delete")}
                      </Button>
                    </div>
                  </div>
                ) : null)
              )}
            </div>
          </FormDialog>
        </div>
      </LayoutGroup>
    </MotionLayout>
  );
}
function dateParts(value: string): [number, number, number] {
  const date = fromIso(value);
  return [date.getFullYear(), date.getMonth(), date.getDate()];
}
