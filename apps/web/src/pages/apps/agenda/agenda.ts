import { z } from "zod";
import type { AgendaEvent } from "../../../demo/apps.ts";
import { AGENDA_USERS } from "../../../demo/apps.ts";
import { addDays, toIso } from "./dates.ts";

const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const appointmentSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(["gesprek", "intake", "deadline"]),
    description: z.string().max(5000),
    date: z.iso.date(),
    endDate: z.iso.date(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    location: z.string().max(500),
    online: z.boolean(),
    link: z.string(),
    organiser: z.string().refine((id) => AGENDA_USERS.some((user) => user.id === id)),
    attendees: z.array(
      z.object({
        userId: z.string().refine((id) => AGENDA_USERS.some((user) => user.id === id)),
        required: z.boolean(),
      }),
    ),
  })
  .superRefine((value, context) => {
    if (!value.allDay && !time.test(value.start))
      context.addIssue({ code: "custom", path: ["start"], message: "time" });
    if (
      value.allDay
        ? value.endDate < value.date
        : !time.test(value.end) || `${value.endDate}T${value.end}` <= `${value.date}T${value.start}`
    )
      context.addIssue({ code: "custom", path: [value.allDay ? "endDate" : "end"], message: "time" });
    if (value.online && !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(value.link))
      context.addIssue({ code: "custom", path: ["link"], message: "url" });
  });
export type AppointmentDraft = z.infer<typeof appointmentSchema>;
export type Appointment = AgendaEvent & AppointmentDraft;
export const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export const clock = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export function localParts(date: Date) {
  return { date: toIso(date), time: clock(date.getHours() * 60 + date.getMinutes()) };
}
export function draftFor(date: string, start = "09:00"): AppointmentDraft {
  const end = localParts(new Date(new Date(`${date}T${start}`).getTime() + 30 * 60_000));
  return {
    title: "",
    type: "gesprek",
    description: "",
    date,
    start,
    endDate: end.date,
    end: end.time,
    allDay: false,
    location: "",
    online: false,
    link: "",
    organiser: "u-eva",
    attendees: [],
  };
}
export function normalizeEvent(event: AgendaEvent): Appointment {
  return {
    ...draftFor(event.date),
    ...event,
    endDate: event.endDate ?? event.date,
    allDay: event.allDay ?? !event.start,
    start: event.start ?? "09:00",
    end: event.end ?? "09:30",
    attendees: event.attendees ?? [{ userId: "u-eva", required: true }],
  };
}
export const eventFromDraft = (draft: AppointmentDraft, id: string): Appointment => ({ ...draft, id });
export function range(event: Appointment): [string, string] {
  return event.allDay
    ? [`${event.date}T00:00`, `${addDays(event.endDate, 1)}T00:00`]
    : [`${event.date}T${event.start}`, `${event.endDate}T${event.end}`];
}
export function occursOn(event: Appointment, date: string) {
  const [start, end] = range(event);
  return start < `${addDays(date, 1)}T00:00` && end > `${date}T00:00`;
}
export function conflicts(event: Appointment, events: readonly Appointment[]): string[] {
  const [start, end] = range(event);
  return event.attendees
    .filter(
      (attendee) =>
        attendee.required &&
        events.some((other) => {
          const [a, b] = range(other);
          return (
            other.id !== event.id &&
            start < b &&
            end > a &&
            other.attendees.some((guest) => guest.userId === attendee.userId)
          );
        }),
    )
    .map((attendee) => attendee.userId);
}
export function shiftEvent(event: Appointment, days: number, delta = 0): Appointment {
  if (event.allDay) return { ...event, date: addDays(event.date, days), endDate: addDays(event.endDate, days) };
  const start = new Date(`${addDays(event.date, days)}T${event.start}`);
  const end = new Date(`${addDays(event.endDate, days)}T${event.end}`);
  start.setMinutes(start.getMinutes() + (event.allDay ? 0 : delta));
  end.setMinutes(end.getMinutes() + (event.allDay ? 0 : delta));
  const a = localParts(start),
    b = localParts(end);
  return { ...event, date: a.date, start: a.time, endDate: b.date, end: b.time };
}
export function resizeEvent(event: Appointment, date: string, minute: number): Appointment {
  const end = localParts(new Date(new Date(`${date}T00:00`).getTime() + Math.round(minute / 15) * 15 * 60_000));
  const next = { ...event, endDate: end.date, end: end.time };
  return appointmentSchema.safeParse(next).success ? next : event;
}

/** Partition connected overlapping intervals into stable, non-overlapping columns. */
export function layoutDay(events: readonly Appointment[], date: string) {
  const segments = events
    .filter((event) => !event.allDay && occursOn(event, date))
    .map((event) => ({
      event,
      start: event.date < date ? 0 : minutes(event.start),
      end: event.endDate > date ? 1440 : minutes(event.end),
      lane: 0,
      lanes: 1,
    }))
    .toSorted((a, b) => a.start - b.start || b.end - a.end || a.event.id.localeCompare(b.event.id));
  let group: typeof segments = [],
    ends: number[] = [],
    boundary = -1;
  const finish = () => {
    for (const segment of group) segment.lanes = ends.length;
    group = [];
    ends = [];
  };
  for (const segment of segments) {
    if (segment.start >= boundary) finish();
    let lane = ends.findIndex((end) => end <= segment.start);
    if (lane < 0) lane = ends.length;
    ends[lane] = segment.end;
    segment.lane = lane;
    group.push(segment);
    boundary = Math.max(boundary, segment.end);
  }
  finish();
  return segments;
}
