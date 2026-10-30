import { describe, expect, it } from "vitest";
import { createMemoryHistory } from "@tanstack/react-router";
import { createAppRouter, validateRouteSearch } from "./router.tsx";
import type { SessionContext } from "./router.tsx";

const org = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  membershipId: "22222222-2222-4222-8222-222222222222",
  name: "Testbureau",
  slug: "testbureau",
  role: "owner" as const,
};
const member = (activeOrganizationId: string | null): SessionContext => ({
  kind: "ready",
  user: { name: "Test Recruiter", email: "test@example.test" },
  data: { organizations: [org], activeOrganizationId },
});
async function visit(path: string, session: SessionContext, demoEnabled = true) {
  const router = createAppRouter({ history: createMemoryHistory({ initialEntries: [path] }), demoEnabled });
  router.update({ context: { session } });
  await router.load();
  return router;
}
describe("ADR 0015 guard matrix", () => {
  it.each(["/inloggen", "/registreren", "/e-mail-bevestigen", "/wachtwoord-vergeten", "/wachtwoord-herstellen"])(
    "allows public guest screen %s",
    async (path) => {
      expect((await visit(path, { kind: "guest" })).state.location.pathname).toBe(path);
    },
  );
  it.each(["/", "/organisatie-kiezen", "/unknown", "/apps/chat"])(
    "replaces protected guest destination %s without a return URL",
    async (path) => {
      const router = await visit(path + "?redirect=https://example.test&next=//example.test", { kind: "guest" });
      expect(router.state.location.href).toBe("/inloggen");
    },
  );
  it.each([null, "33333333-3333-4333-8333-333333333333"])(
    "requires membership matching active organization %s",
    async (id) => {
      await Promise.all(
        ["/", "/inloggen", "/registreren", "/unknown", "/organisatie-kiezen"].map(async (path) => {
          expect((await visit(path, member(id))).state.location.pathname).toBe("/organisatie-kiezen");
        }),
      );
      await Promise.all(
        ["/e-mail-bevestigen", "/wachtwoord-vergeten", "/wachtwoord-herstellen"].map(async (path) => {
          expect((await visit(path, member(id))).state.location.pathname).toBe(path);
        }),
      );
    },
  );
  it.each(["/inloggen", "/registreren"])("sends an active member from %s home", async (path) => {
    expect((await visit(path, member(org.organizationId))).state.location.pathname).toBe("/");
  });
  it.each([
    "/organisatie-kiezen",
    "/e-mail-bevestigen",
    "/wachtwoord-vergeten",
    "/wachtwoord-herstellen",
    "/apps/chat",
  ])("keeps active member destination %s", async (path) => {
    expect((await visit(path, member(org.organizationId))).state.location.pathname).toBe(path);
  });
  it.each<SessionContext>([{ kind: "loading" }, { kind: "error", message: "auth.error" }])(
    "does not redirect unresolved/error sessions",
    async (session) => {
      expect((await visit("/unknown", session)).state.location.pathname).toBe("/unknown");
    },
  );
  it("resolves unknown and disabled demos to dashboard 404 after guards", async () => {
    await Promise.all(
      ["/unknown", "/apps/chat", "/paginas/authenticatie/gelukt"].map(async (path) => {
        const router = await visit(path, member(org.organizationId), false);
        expect(router.state.matches.some((match) => match["_notFound"] || match.status === "notFound")).toBe(true);
      }),
    );
  });
  it("allows enabled demo auth before session guards", async () => {
    const router = await visit("/paginas/authenticatie/gelukt", { kind: "guest" });
    expect(router.state.location.pathname).toBe("/paginas/authenticatie/gelukt");
  });
});

it("waits for session resolution before child guards and replaces the guest URL", async () => {
  const gate = Promise.withResolvers<SessionContext>();
  const history = createMemoryHistory({ initialEntries: ["/apps/chat"] });
  const router = createAppRouter({ history });
  router.update({ context: { session: { kind: "loading" }, resolveSession: () => gate.promise } });
  const loading = router.load();
  expect(history.location.pathname).toBe("/apps/chat");
  gate.resolve({ kind: "guest" });
  await loading;
  expect(history.location.pathname).toBe("/inloggen");
  expect(history.length).toBe(1);
});

it("validates only allowlisted development search primitives", async () => {
  expect(
    validateRouteSearch({ preview: "guest", theme: "dark", next: "//example.test", tokenLike: "discard" }),
  ).toEqual({ preview: "guest", theme: "dark" });
  expect(validateRouteSearch({ preview: "unknown", theme: "unknown" })).toEqual({});
  const router = await visit("/inloggen", { kind: "guest" });
  await router.navigate({ to: "/registreren", search: { preview: "guest", theme: "dark" } });
  expect(router.state.matches.at(-1)?.search).toEqual({ preview: "guest", theme: "dark" });
});

it("registers the complete existing route inventory with its metadata", async () => {
  const { routes, demoAuthRoutes, authRouteTitles } = await import("./routes.ts");
  const router = createAppRouter({ history: createMemoryHistory() });
  for (const definition of [...routes, ...demoAuthRoutes]) {
    expect(router.routesByPath[definition.path].options.staticData).toMatchObject({
      titleKey: definition.titleKey,
      layout: definition.layout,
      access: definition.access,
      demo: "demo" in definition ? definition.demo : false,
    });
  }
  expect(Object.keys(router.routesByPath)).toEqual(expect.arrayContaining(Object.keys(authRouteTitles)));
});
