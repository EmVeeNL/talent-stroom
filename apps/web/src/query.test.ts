import { afterEach, describe, expect, it, vi } from "vitest";
import { createTransport, RequestError } from "./auth.ts";
import { createDataLayer, queryKeys, retryQuery, problemError } from "./query.ts";
import { errorKey } from "./auth.ts";
import { PROBLEMS } from "@talentstroom/contracts";

const orgA = "11111111-1111-4111-8111-111111111111";
const orgB = "33333333-3333-4333-8333-333333333333";
function setup() {
  let active = orgA;
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith("get-session")) return Response.json({ user: {} });
      return Response.json({
        activeOrganizationId: active,
        organizations: [orgA, orgB].map((organizationId) => ({
          organizationId,
          membershipId: orgB,
          name: "Synthetic agency",
          slug: "synthetic",
          role: "owner",
        })),
      });
    }),
  );
  const expired = vi.fn<() => void>();
  const layer = createDataLayer({ onExpired: expired });
  const transport = createTransport();
  return {
    layer,
    transport,
    expired,
    switchToB: () => {
      active = orgB;
    },
  };
}
afterEach(() => vi.unstubAllGlobals());

describe("private server state lifecycle", () => {
  it("removes org A and ignores a deliberately late response after switching", async () => {
    const { layer, transport, switchToB } = setup();
    await layer.bootstrap(transport);
    layer.client.setQueryData(queryKeys.org(orgA, "vacancies", "list"), ["Synthetic vacancy"]);
    const late = Promise.withResolvers<string>();
    const options = layer.orgQuery(orgA, "vacancies", "late", async () => late.promise);
    const pending = layer.client.fetchQuery(options).catch(() => undefined);
    await layer.transition(transport, queryKeys.org(orgA, "organizations", "switch"), async () => switchToB());
    late.resolve("Old tenant response");
    await pending;
    expect(layer.client.getQueryCache().findAll({ queryKey: ["org", orgA] })).toEqual([]);
    expect(layer.activeOrganizationId).toBe(orgB);
  });
  it("aborts scoped mutations and gates late callbacks and invalidations", async () => {
    const { layer, transport, switchToB } = setup();
    await layer.bootstrap(transport);
    const late = Promise.withResolvers<string>();
    const applied = vi.fn<(result: string) => void>();
    let signal: AbortSignal | undefined;
    const pending = layer
      .orgMutation(
        orgA,
        "vacancies",
        "update",
        async (abort) => {
          signal = abort;
          return late.promise;
        },
        applied,
      )
      .catch(() => undefined);
    await layer.transition(transport, queryKeys.org(orgA, "organizations", "switch"), async () => switchToB());
    late.resolve("Old mutation");
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(applied).not.toHaveBeenCalled();
    expect(layer.client.getMutationCache().getAll()).toEqual([]);
  });
  it("clears queries and mutations on sign-out, even when sign-out fails", async () => {
    const { layer, transport } = setup();
    await layer.bootstrap(transport);
    layer.client.setQueryData(queryKeys.org(orgA, "vacancies", "list"), ["Synthetic"]);
    await expect(
      layer.transition(
        transport,
        ["session", "sign-out"],
        async () => {
          throw new RequestError(500);
        },
        false,
      ),
    ).rejects.toThrow("Request failed");
    expect(layer.client.getQueryCache().getAll()).toEqual([]);
    expect(layer.client.getMutationCache().getAll()).toEqual([]);
  });
  it("expires and clears the whole cache on a scoped 401", async () => {
    const { layer, transport, expired } = setup();
    await layer.bootstrap(transport);
    await expect(
      layer.client.fetchQuery(
        layer.orgQuery(orgA, "vacancies", "list", async () => {
          throw new RequestError(401);
        }),
      ),
    ).rejects.toThrow("Request failed");
    expect(expired).toHaveBeenCalledOnce();
    expect(layer.client.getQueryCache().getAll()).toEqual([]);
  });
  it("reloads authoritative memberships into an empty cache after a failed switch", async () => {
    const { layer, transport } = setup();
    await layer.bootstrap(transport);
    layer.client.setQueryData(queryKeys.org(orgA, "vacancies", "list"), ["Synthetic"]);
    await expect(
      layer.transition(transport, queryKeys.org(orgA, "organizations", "switch"), async () => {
        throw new RequestError(403);
      }),
    ).rejects.toThrow("Request failed");
    expect(layer.activeOrganizationId).toBe(orgA);
    expect(layer.client.getQueryData(queryKeys.org(orgA, "vacancies", "list"))).toBeUndefined();
  });
  it("rejects new work and rapid overlapping transitions while switching", async () => {
    const { layer, transport } = setup();
    await layer.bootstrap(transport);
    const wait = Promise.withResolvers<void>();
    const pending = layer.transition(
      transport,
      queryKeys.org(orgA, "organizations", "switch"),
      async () => wait.promise,
    );
    expect(() => layer.orgQuery(orgA, "vacancies", "list", async () => [])).toThrow("Aborted");
    await expect(layer.transition(transport, ["session", "switch"], async () => undefined)).rejects.toThrow("Aborted");
    wait.resolve();
    await pending;
  });
  it("clears immediately on successful sign-out and ignores late mutation completion", async () => {
    const { layer, transport } = setup();
    await layer.bootstrap(transport);
    const late = Promise.withResolvers<string>();
    const applied = vi.fn<(result: string) => void>();
    const pending = layer
      .orgMutation(orgA, "vacancies", "update", async () => late.promise, applied)
      .catch(() => undefined);
    await layer.transition(transport, ["session", "sign-out"], async () => undefined, false);
    expect(layer.client.getQueryCache().getAll()).toEqual([]);
    expect(layer.client.getMutationCache().getAll()).toEqual([]);
    late.resolve("Synthetic late result");
    await pending;
    expect(applied).not.toHaveBeenCalled();
  });
  it("clears on bootstrap 401 without retrying", async () => {
    const { layer, transport, expired } = setup();
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 401 }));
    await expect(layer.bootstrap(transport)).rejects.toThrow("Request failed");
    expect(fetch).toHaveBeenCalledOnce();
    expect(expired).toHaveBeenCalledOnce();
    expect(layer.client.getQueryCache().getAll()).toEqual([]);
  });
  it("discards stale scope and revalidates after forbidden/mismatch responses", async () => {
    const { layer, transport, switchToB } = setup();
    await layer.bootstrap(transport);
    let recovery: Promise<unknown> | undefined;
    layer.setHandlers({
      onScopeChanged: () => {
        switchToB();
        recovery = layer.reset().then(() => layer.bootstrap(transport));
      },
    });
    await layer.client
      .fetchQuery(
        layer.orgQuery(orgA, "vacancies", "list", async () => {
          throw new RequestError(409);
        }),
      )
      .catch(() => undefined);
    await recovery;
    expect(layer.activeOrganizationId).toBe(orgB);
    expect(layer.client.getQueryCache().findAll({ queryKey: ["org", orgA] })).toEqual([]);
  });
  it("confirms membership after cookie rotation instead of trusting a requested organization", async () => {
    const { layer, transport } = setup();
    await layer.bootstrap(transport);
    await layer.transition(transport, queryKeys.org(orgB, "organizations", "switch"), async () => undefined);
    expect(layer.activeOrganizationId).toBe(orgA);
    expect(() => layer.orgQuery(orgB, "vacancies", "list", async () => [])).toThrow("Aborted");
  });
  it("never stores sign-in credentials in mutation keys, variables or metadata", async () => {
    const { layer, transport } = setup();
    const late = Promise.withResolvers<Response>();
    vi.mocked(fetch).mockImplementationOnce(async () => late.promise);
    const pending = layer.signIn(
      transport,
      { email: "synthetic@example.test", password: "synthetic-password" },
      "nl-NL",
    );
    const mutations = layer.client.getMutationCache().getAll();
    expect(mutations).toHaveLength(1);
    expect(mutations[0]?.options.mutationKey).toEqual(["session", "sign-in"]);
    expect(mutations[0]?.state.variables).toBeUndefined();
    expect(mutations[0]?.meta).toBeUndefined();
    late.resolve(Response.json({}));
    await pending;
    expect(layer.client.getMutationCache().getAll()).toEqual([]);
  });
  it("keeps key factories free of personal data and clients private", () => {
    const { layer } = setup();
    expect(queryKeys.session).toEqual(["session"]);
    expect(queryKeys.organizations).toEqual(["me", "organizations"]);
    expect(queryKeys.org(orgA, "vacancies", "list", { page: 1, sort: "created-desc" })).toEqual([
      "org",
      orgA,
      "vacancies",
      "list",
      { page: 1, sort: "created-desc" },
    ]);
    expect(createDataLayer().client).not.toBe(layer.client);
  });
});

it("sanitizes problem fields and retains existing translated error semantics", () => {
  const response = new Response(null, { status: 422, headers: { "Content-Type": "application/problem+json" } });
  const error = problemError(response, {
    type: PROBLEMS.validationError.type,
    title: "Private title",
    status: 422,
    requestId: "11111111-1111-4111-8111-111111111111",
    detail: "Private detail",
    instance: "Private URL",
    errors: [
      { path: "name", message: "too_small" },
      { path: "private@example.test", message: "Private value" },
    ],
  });
  expect(errorKey(error)).toBe("auth.validation");
  expect(JSON.stringify(error)).not.toMatch(/Private|example\.test/);
  expect(error.fields).toEqual([{ path: "name", code: "too_small" }]);
});
it("retries only one network/5xx failure, never aborts or 4xx", () => {
  for (const status of [400, 401, 403, 409, 422, 429]) expect(retryQuery(0, new RequestError(status))).toBe(false);
  expect(retryQuery(0, new DOMException("Aborted", "AbortError"))).toBe(false);
  expect(retryQuery(0, new RequestError(500))).toBe(true);
  expect(retryQuery(1, new RequestError(500))).toBe(false);
  expect(retryQuery(0, new TypeError("Network"))).toBe(true);
});
