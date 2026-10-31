import { describe, expect, it } from "vitest";
import { appointmentSchema, draftFor, eventFromDraft, occursOn, conflicts, shiftEvent, resizeEvent } from "./agenda.ts";
import { createDemoStore } from "../../../demo/store.ts";

const base = () =>
  eventFromDraft(
    {
      ...draftFor("2026-10-30", "09:00"),
      title: "Synthetic appointment",
      attendees: [{ userId: "u-eva", required: true }],
    },
    "test",
  );
describe("full agenda", () => {
  it("prefills a half-hour slot and validates title, real times, end order and online links", () => {
    expect(draftFor("2026-10-30", "23:45")).toMatchObject({ endDate: "2026-10-31", end: "00:15" });
    expect(appointmentSchema.safeParse(draftFor("2026-10-30")).success).toBe(false);
    const draft = { ...draftFor("2026-10-30"), title: "Test" };
    expect(appointmentSchema.safeParse({ ...draft, end: "08:00" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...draft, start: "27:00" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...draft, online: true, link: "javascript:alert(1)" }).success).toBe(false);
    expect(appointmentSchema.safeParse({ ...draft, allDay: true, start: "", end: "" }).success).toBe(true);
    expect(appointmentSchema.safeParse({ ...draft, endDate: "2026-10-31" }).success).toBe(true);
  });
  it("includes each day of multi-day appointments and treats adjacent appointments as non-conflicting", () => {
    const event = base();
    expect(occursOn({ ...event, endDate: "2026-11-01", end: "00:00" }, "2026-10-31")).toBe(true);
    expect(occursOn({ ...event, endDate: "2026-11-01", end: "00:00" }, "2026-11-01")).toBe(false);
    expect(conflicts({ ...event, id: "other" }, [event])).toEqual(["u-eva"]);
    expect(conflicts({ ...event, id: "other", start: "09:30", end: "10:00" }, [event])).toEqual([]);
    expect(conflicts({ ...event, id: "other", attendees: [{ userId: "u-eva", required: false }] }, [event])).toEqual(
      [],
    );
    expect(conflicts(event, [event])).toEqual([]);
  });
  it("moves across midnight preserving duration, snaps resizing and rejects an inverted range", () => {
    const moved = shiftEvent(base(), 1, -15);
    expect(moved).toMatchObject({ date: "2026-10-31", start: "08:45", end: "09:15" });
    expect(resizeEvent(base(), "2026-10-30", 9 * 60 + 43)).toMatchObject({ end: "09:45" });
    expect(resizeEvent(base(), "2026-10-30", 8 * 60)).toEqual(base());
  });
  it("shares linked tasks, organiser assignment and completion across subscribers without persistence", () => {
    const store = createDemoStore();
    const event = base();
    store.save(event);
    store.taskFrom(event, "Voorbereiden: Synthetic appointment");
    const task = store.getSnapshot().tasks.at(-1);
    if (!task) throw new Error("Expected linked task");
    expect(task).toMatchObject({ appointmentId: event.id, assignee: event.organiser, due: "2026-10-30T09:00" });
    store.toggleTask(task.id);
    expect(store.getSnapshot().tasks.at(-1)?.done).toBe(true);
    const beforeRemoval = store.getSnapshot();
    store.remove(event.id);
    expect(beforeRemoval.tasks.at(-1)?.appointmentId).toBe(event.id);
    expect(store.getSnapshot().tasks.at(-1)?.appointmentId).toBeUndefined();
  });
});

it("assigns separate lanes across an entire overlapping group", async () => {
  const { layoutDay } = await import("./agenda.ts");
  const a = base();
  const layout = layoutDay(
    [a, { ...a, id: "b", start: "09:15", end: "10:00" }, { ...a, id: "c", start: "09:45", end: "10:15" }],
    a.date,
  );
  expect(layout.map(({ lane, lanes }) => [lane, lanes])).toEqual([
    [0, 2],
    [1, 2],
    [0, 2],
  ]);
});
