import { AsyncLocalStorage } from "node:async_hooks";

// Workaround for better-auth#10315 (ADR 0006 risk 1): Better Auth lazily creates three
// AsyncLocalStorage instances behind cached promises. If the first request in an isolate is
// aborted while that promise is pending, every later auth call in the isolate hangs. Seeding
// them here runs at isolate start-up (module evaluation), never inside a request.
// Better Auth reads them from this global (`@better-auth/core` context/global.mjs, 1.7.12).
const GLOBAL_KEY = Symbol.for("better-auth:global");
const STORAGES = ["adapterAsyncStorage", "requestStateAsyncStorage", "endpointContextAsyncStorage"] as const;

function contextObject(): object | undefined {
  const holder: unknown = Reflect.get(globalThis, GLOBAL_KEY);
  if (typeof holder !== "object" || holder === null) return undefined;
  const context: unknown = Reflect.get(holder, "context");
  return typeof context === "object" && context !== null ? context : undefined;
}

if (contextObject() === undefined) {
  Reflect.set(globalThis, GLOBAL_KEY, { version: "1.7.12", epoch: 1, context: {} });
}
const seededContext = contextObject();
for (const name of STORAGES) {
  if (seededContext !== undefined && !(Reflect.get(seededContext, name) instanceof AsyncLocalStorage)) {
    Reflect.set(seededContext, name, new AsyncLocalStorage());
  }
}

/** True once the module-scope seed ran; checked before every Better Auth instance. */
export function asyncStorageSeeded(): boolean {
  const context = contextObject();
  return context !== undefined && STORAGES.every((name) => Reflect.get(context, name) instanceof AsyncLocalStorage);
}
