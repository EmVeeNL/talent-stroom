import { useSyncExternalStore } from "react";
import type { MessageKey } from "@talentstroom/i18n";
import { AGENDA_EVENTS, DEMO_TODAY } from "./apps.ts";
import { normalizeEvent } from "../pages/apps/agenda/agenda.ts";
import type { Appointment } from "../pages/apps/agenda/agenda.ts";
export interface DemoTask {
  id: string;
  title: string;
  titleKey?: MessageKey;
  due: string;
  assignee: string;
  appointmentId?: string;
  done: boolean;
}
const INITIAL_TASK_KEYS = [
  "demo.dashboard.task1",
  "demo.dashboard.task2",
  "demo.dashboard.task3",
  "demo.dashboard.task4",
] as const;
/** Synthetic, tab-local demo data only. Never used by an API or persisted. */
export function createDemoStore() {
  let state = {
    events: AGENDA_EVENTS.map(normalizeEvent),
    tasks: INITIAL_TASK_KEYS.map((titleKey, index): DemoTask => ({
      id: `task-${index + 1}`,
      title: "",
      titleKey,
      due: `${DEMO_TODAY}T${["09:00", "10:30", "13:00", "15:00"][index]}`,
      assignee: "u-eva",
      done: index === 0,
    })),
  };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    save(event: Appointment) {
      state = {
        ...state,
        events: state.events.some((item) => item.id === event.id)
          ? state.events.map((item) => (item.id === event.id ? event : item))
          : [...state.events, event],
      };
      emit();
    },
    remove(id: string) {
      state = {
        events: state.events.filter((item) => item.id !== id),
        tasks: state.tasks.map((task) => {
          if (task.appointmentId !== id) return task;
          const { appointmentId: _unlinked, ...unlinked } = task;
          return unlinked;
        }),
      };
      emit();
    },
    taskFrom(event: Appointment, title: string) {
      state = {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: crypto.randomUUID(),
            title,
            due: `${event.date}T${event.allDay ? "00:00" : event.start}`,
            assignee: event.organiser,
            appointmentId: event.id,
            done: false,
          },
        ],
      };
      emit();
    },
    toggleTask(id: string) {
      state = {
        ...state,
        tasks: state.tasks.map((task) => (task.id === id ? Object.assign({}, task, { done: !task.done }) : task)),
      };
      emit();
    },
    reset() {
      state = createDemoStore().getSnapshot();
      emit();
    },
  };
}
export const demoStore = createDemoStore();
export const useDemoStore = () =>
  useSyncExternalStore(demoStore.subscribe, demoStore.getSnapshot, demoStore.getSnapshot);
