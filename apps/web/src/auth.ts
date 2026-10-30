import { createApiClient } from "@talentstroom/api-client";
import type { Locale, MessageKey } from "@talentstroom/i18n";

export class RequestError extends Error {
  constructor(readonly status: number) {
    super("Request failed");
  }
}
export function errorKey(error: unknown, login = false): MessageKey {
  const status = error instanceof RequestError ? error.status : 0;
  if (status === 429) return "auth.rateLimit";
  if (login) return "auth.loginError";
  if (status === 403) return "auth.forbidden";
  if (status === 400 || status === 422) return "auth.validation";
  return "auth.error";
}

/** The only retained server data is App's context. Never persist credentials or tenant data. */
export function createTransport() {
  let controller = new AbortController();
  const cancel = () => {
    controller.abort();
    controller = new AbortController();
  };
  const api = createApiClient({ baseUrl: new URL("/api", window.location.origin).href });
  async function auth(
    path: string,
    body?: Record<string, string>,
    locale: Locale = "nl-NL",
    signal = controller.signal,
  ): Promise<unknown> {
    const response = await fetch(`/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
      headers: { "Accept-Language": locale, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    signal.throwIfAborted();
    if (!response.ok) throw new RequestError(response.status);
    const data: unknown = await response.json();
    signal.throwIfAborted();
    return data;
  }
  return {
    api,
    auth,
    cancel,
    get signal() {
      return controller.signal;
    },
  };
}
export type Transport = ReturnType<typeof createTransport>;
// The typed operation gives the precise response without duplicating the API contract.
export async function listOrganizations(transport: Transport, signal: AbortSignal) {
  const result = await transport.api.GET("/v1/me/organizations", { signal, cache: "no-store" });
  if (!result.data) throw new RequestError(result.response.status);
  return result.data;
}
export type OrganizationList = Awaited<ReturnType<typeof listOrganizations>>;
export function isAborted(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
