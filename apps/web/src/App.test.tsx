import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { App } from "./App.tsx";
import * as routing from "./router.tsx";

const org = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  membershipId: "22222222-2222-4222-8222-222222222222",
  name: "Testbureau",
  slug: "testbureau",
  role: "owner",
};
let signedIn = false;
let active: string | null = null;
let status = 200;
let organizationStatus = 200;
let organizations = [org];
let lastBody: unknown;
let intercept: ((request: Request) => Promise<Response> | undefined) | undefined;
const requests: { url: string; method: string }[] = [];

function setup(
  path = "/inloggen",
  authenticated = false,
  activeOrg: string | null = null,
  interceptor?: (request: Request) => Promise<Response> | undefined,
) {
  signedIn = authenticated;
  active = activeOrg;
  status = 200;
  organizationStatus = 200;
  organizations = [org];
  requests.length = 0;
  lastBody = undefined;
  intercept = interceptor;
  window.history.replaceState(null, "", path);
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(new URL(String(input), window.location.origin), init);
      const url = new URL(request.url);
      requests.push({ url: url.pathname, method: request.method });
      const intercepted = intercept?.(request);
      if (intercepted) return intercepted;
      if (url.pathname.endsWith("get-session"))
        return Response.json(
          signedIn
            ? { user: { emailVerified: true, name: "Robin Voorbeeld", email: "robin@example.test" }, session: {} }
            : null,
        );
      if (request.method === "GET") {
        if (organizationStatus !== 200)
          return Response.json({ status: organizationStatus }, { status: organizationStatus });
        return Response.json({ organizations, activeOrganizationId: active });
      }
      lastBody = request.headers.has("content-type") ? await request.json() : undefined;
      if (status !== 200)
        return Response.json(
          { title: "Private server detail", status, errors: [{ path: "name", message: "Private value" }] },
          { status, headers: { "Content-Type": "application/problem+json" } },
        );
      if (url.pathname.endsWith("sign-in/email")) signedIn = true;
      if (url.pathname.endsWith("sign-out")) signedIn = false;
      if (url.pathname.endsWith("/switch") || url.pathname === "/api/v1/organizations") active = org.organizationId;
      return Response.json(org);
    }),
  );
  return render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
async function fillLogin() {
  await userEvent.type(await screen.findByLabelText(/^E-mailadres/), "recruiter@example.test");
  await userEvent.type(screen.getByLabelText(/^Wachtwoord \*/), "synthetic-password");
}
afterEach(() => vi.unstubAllGlobals());

describe("authentication routing", () => {
  it("redirects guests and focuses the page heading", async () => {
    setup("/");
    const heading = await screen.findByRole("heading", { level: 1, name: "Welkom terug" });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(window.location.pathname).toBe("/inloggen");
  });
  it("redirects a signed-in user without an organization to the picker", async () => {
    setup("/", true);
    await screen.findByRole("heading", { name: "Kies je organisatie" });
    expect(window.location.pathname).toBe("/organisatie-kiezen");
  });
  it("opens the active workspace in the app shell and signs out from the user menu", async () => {
    const { container } = setup("/inloggen", true, org.organizationId);
    await screen.findByRole("heading", { level: 1, name: "Je werkruimte" });
    expect(screen.getAllByText(org.name).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "Hoofdnavigatie" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dashboard" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Recruitment" }).getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: /Kandidaten/ })).toBeNull();
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map((v) => v.id)).toEqual([]);
    const menu = screen.getByRole("button", { name: "Gebruikersmenu: Robin Voorbeeld, Testbureau" });
    await userEvent.click(menu);
    expect(screen.getByText("robin@example.test")).toBeTruthy();
    await userEvent.click(screen.getByRole("menuitem", { name: "Uitloggen" }));
    await screen.findByRole("heading", { name: "Welkom terug" });
    expect(requests.some((r) => r.url === "/api/auth/sign-out")).toBe(true);
  });
  it("supports navigation links and browser history", async () => {
    setup();
    await userEvent.click(await screen.findByRole("link", { name: "Registreren" }));
    expect(window.location.pathname).toBe("/registreren");
    window.history.replaceState(null, "", "/wachtwoord-vergeten");
    fireEvent.popState(window);
    await screen.findByRole("heading", { name: "Wachtwoord vergeten?" });
  });
});

describe("login", () => {
  it("shows and hides the password and signs in with same-origin cookies", async () => {
    setup();
    expect(await screen.findByRole("tablist", { name: "Inlogmethode" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Passkey/ }).hasAttribute("disabled")).toBe(true);
    await fillLogin();
    await userEvent.click(screen.getByRole("button", { name: "Wachtwoord tonen" }));
    expect(screen.getByLabelText(/^Wachtwoord \*/).getAttribute("type")).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Wachtwoord verbergen" }));
    await userEvent.click(screen.getByRole("button", { name: "Inloggen" }));
    await screen.findByRole("heading", { name: "Kies je organisatie" });
    expect(lastBody).toMatchObject({ email: "recruiter@example.test", password: "synthetic-password" });
  });
  it.each([401, 403, 422, 429])("announces a safe error for %s", async (code) => {
    setup();
    await fillLogin();
    status = code;
    await userEvent.click(screen.getByRole("button", { name: "Inloggen" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      code === 429 ? "Te veel pogingen" : "Inloggen is niet gelukt",
    );
    expect(screen.queryByText("Private server detail")).toBeNull();
  });
  it("has accessible form semantics and supports English", async () => {
    const { container } = setup();
    await screen.findByRole("heading", { name: "Welkom terug" });
    expect(screen.getByRole("form", { name: "Welkom terug" })).toBeTruthy();
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations.map((v) => v.id)).toEqual([]);
    await userEvent.selectOptions(screen.getByLabelText("Taal"), "en-GB");
    await screen.findByRole("heading", { name: "Welcome back" });
  });
});

describe("email and password screens", () => {
  it("requires terms and a long password before registering, then asks to check email", async () => {
    setup("/registreren");
    await userEvent.type(await screen.findByLabelText(/^Naam/), "Test Recruiter");
    await userEvent.type(screen.getByLabelText(/^E-mailadres/), "recruiter@example.test");
    await userEvent.type(screen.getByLabelText(/^Wachtwoord \*/), "short");
    await userEvent.click(screen.getByRole("button", { name: "Account aanmaken" }));
    expect(requests.some((r) => r.url.endsWith("sign-up/email"))).toBe(false);
    await userEvent.clear(screen.getByLabelText(/^Wachtwoord \*/));
    await userEvent.type(screen.getByLabelText(/^Wachtwoord \*/), "synthetic-password");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Account aanmaken" }));
    await screen.findByRole("status");
    expect(lastBody).toMatchObject({ callbackURL: expect.stringContaining("/e-mail-bevestigen") });
  });
  it("requests a reset without revealing account existence", async () => {
    setup("/wachtwoord-vergeten");
    await userEvent.type(await screen.findByLabelText(/^E-mailadres/), "recruiter@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Herstellink versturen" }));
    expect((await screen.findByRole("status")).textContent).toContain("e-mail");
    expect(lastBody).toMatchObject({ redirectTo: expect.stringContaining("/wachtwoord-herstellen") });
  });
  it("resets with the token, strips it from the address bar and links to login", async () => {
    setup("/wachtwoord-herstellen?token=synthetic-reset-token");
    await userEvent.type(await screen.findByLabelText(/^Wachtwoord \*/), "synthetic-password");
    expect(window.location.search).toBe("");
    await userEvent.click(screen.getByRole("button", { name: "Wachtwoord opslaan" }));
    await screen.findByRole("status");
    expect(lastBody).toEqual({ token: "synthetic-reset-token", newPassword: "synthetic-password" });
  });
  it("handles an expired reset link with recovery", async () => {
    setup("/wachtwoord-herstellen?error=INVALID_TOKEN");
    await screen.findByRole("alert");
    expect(screen.getByRole("link", { name: "Nieuwe herstellink aanvragen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Wachtwoord opslaan" })).toBeNull();
  });
  it("handles verification callbacks and allows resend after expiry", async () => {
    setup("/e-mail-bevestigen?error=TOKEN_EXPIRED");
    await screen.findByRole("alert");
    await userEvent.type(screen.getByLabelText(/^E-mailadres/), "recruiter@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Bevestigingsmail versturen" }));
    await screen.findByRole("status");
    expect(requests.some((r) => r.url.endsWith("send-verification-email"))).toBe(true);
  });
  it("shows verification success with a sign-in link", async () => {
    setup("/e-mail-bevestigen");
    await screen.findByText("Je e-mailadres is bevestigd. Je kunt nu inloggen.");
    expect(screen.getByRole("link", { name: "Inloggen" })).toBeTruthy();
  });
  it.each(
    [
      "/registreren",
      "/wachtwoord-vergeten",
      "/wachtwoord-herstellen?token=test",
      "/e-mail-bevestigen?error=expired",
    ].flatMap((path) => [401, 403, 422, 429].map((code) => [path, code] as const)),
  )("handles server failure on %s (%s)", async (path, code) => {
    setup(path);
    await screen.findByRole("heading", { level: 1 });
    const email = screen.queryByLabelText(/^E-mailadres/);
    if (email) await userEvent.type(email, "recruiter@example.test");
    const name = screen.queryByLabelText(/^Naam/);
    if (name) await userEvent.type(name, "Test Recruiter");
    const password = screen.queryByLabelText(/^Wachtwoord \*/);
    if (password) await userEvent.type(password, "synthetic-password");
    const terms = screen.queryByRole("checkbox");
    if (terms) await userEvent.click(terms);
    status = code;
    const form = document.querySelector("form");
    if (!form) throw new Error("Expected a form");
    fireEvent.submit(form);
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("alert")
          .some((el) =>
            el.textContent?.includes(
              code === 429
                ? "Te veel pogingen"
                : code === 403
                  ? "Je hebt geen toegang"
                  : code === 401
                    ? "Dit is niet gelukt"
                    : "Controleer",
            ),
          ),
      ).toBe(true),
    );
  });
});

describe("organization picker", () => {
  it("confirms a selection, rotates the session and reloads scoped context", async () => {
    setup("/", true);
    await userEvent.click(await screen.findByRole("radio", { name: new RegExp(org.name) }));
    await userEvent.click(screen.getByRole("button", { name: "Organisatie openen" }));
    await screen.findByRole("heading", { name: "Je werkruimte" });
    expect(requests.filter((r) => r.url === "/api/v1/me/organizations").length).toBe(2);
    expect(requests.some((r) => r.url === "/api/v1/organizations/" + org.organizationId + "/switch")).toBe(true);
  });
  it("creates an organization", async () => {
    setup("/", true);
    await userEvent.type(await screen.findByLabelText(/^Organisatienaam/), "Testbureau");
    await userEvent.click(screen.getByRole("button", { name: "Organisatie aanmaken" }));
    await screen.findByRole("heading", { name: "Je werkruimte" });
    expect(lastBody).toEqual({ name: "Testbureau" });
  });
  it("switches from the navbar organization switcher, rotating the session and reloading memberships", async () => {
    const second = { ...org, organizationId: "33333333-3333-4333-8333-333333333333", name: "Tweede testbureau" };
    setup("/", true, second.organizationId);
    organizations = [org, second];
    const trigger = await screen.findByRole("button", { name: "Switch organisatie: Tweede testbureau" });
    const reads = requests.filter((r) => r.url === "/api/v1/me/organizations").length;
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "Switch organisatie" });
    expect(
      within(dialog)
        .getByRole("option", { name: /Tweede testbureau/ })
        .getAttribute("aria-selected"),
    ).toBe("true");
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await screen.findByRole("button", { name: "Switch organisatie: Testbureau" });
    expect(requests.some((r) => r.url === "/api/v1/organizations/" + org.organizationId + "/switch")).toBe(true);
    expect(requests.filter((r) => r.url === "/api/v1/me/organizations").length).toBe(reads + 1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it.each([401, 403, 422, 429])("handles organization failure %s without entering a workspace", async (code) => {
    setup("/", true);
    await userEvent.type(await screen.findByLabelText(/^Organisatienaam/), "Testbureau");
    status = code;
    await userEvent.click(screen.getByRole("button", { name: "Organisatie aanmaken" }));
    if (code === 401) await screen.findByRole("heading", { name: "Welkom terug" });
    else await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Je werkruimte" })).toBeNull();
  });
});

describe("context and keyboard safety", () => {
  it.each([401, 403, 429])("handles membership-list failure %s", async (code) => {
    setup("/", true);
    organizationStatus = code;
    if (code === 401) await screen.findByRole("heading", { name: "Welkom terug" });
    else await screen.findByRole("alert");
    expect(screen.queryByRole("heading", { name: "Je werkruimte" })).toBeNull();
  });
  it("offers creation with no memberships", async () => {
    setup("/", true);
    organizations = [];
    await screen.findByText("Je bent nog geen lid van een organisatie. Maak hieronder je eerste organisatie aan.");
    expect(screen.getByRole("button", { name: "Organisatie aanmaken" })).toBeTruthy();
  });
  it("does not switch for the current membership and replaces active context after a switch", async () => {
    const second = { ...org, organizationId: "33333333-3333-4333-8333-333333333333", name: "Tweede testbureau" };
    setup("/", true, second.organizationId);
    organizations = [org, second];
    const trigger = await screen.findByRole("button", { name: /^Switch organisatie/ });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { name: /Tweede testbureau/ }));
    expect(requests.some((request) => request.url.endsWith("/switch"))).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole("option", { name: new RegExp(`^${org.name}`) }));
    await screen.findByRole("button", { name: `Switch organisatie: ${org.name}` });
    expect(screen.getByRole("button", { name: /Gebruikersmenu/ }).getAttribute("aria-label")).not.toContain(
      second.name,
    );
  });
  it("shows a safe error in the switcher and expires the session on 401", async () => {
    const second = { ...org, organizationId: "33333333-3333-4333-8333-333333333333", name: "Tweede testbureau" };
    setup("/", true, second.organizationId);
    organizations = [org, second];
    await userEvent.click(await screen.findByRole("button", { name: /^Switch organisatie/ }));
    status = 403;
    await userEvent.click(screen.getByRole("option", { name: new RegExp(`^${org.name}`) }));
    expect((await screen.findByRole("alert")).textContent).not.toContain("Private");
    status = 401;
    await userEvent.click(screen.getByRole("option", { name: new RegExp(`^${org.name}`) }));
    await screen.findByRole("heading", { name: "Welkom terug" });
  });
  it("supports keyboard submission and restores heading focus", async () => {
    setup();
    const email = await screen.findByLabelText(/^E-mailadres/);
    email.focus();
    await userEvent.keyboard("recruiter@example.test{Tab}synthetic-password{Enter}");
    const heading = await screen.findByRole("heading", { name: "Kies je organisatie" });
    await waitFor(() => expect(document.activeElement).toBe(heading));
  });
  it("shows safe network errors", async () => {
    setup();
    await fillLogin();
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Sensitive server detail"));
    await userEvent.click(screen.getByRole("button", { name: "Inloggen" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Inloggen is niet gelukt");
  });
  it("keeps the dev gallery available without auth requests", async () => {
    setup("/?gallery");
    await screen.findByRole("tablist", { name: "Componentcategorieën" });
    expect(requests).toEqual([]);
  });
});

describe("request cancellation", () => {
  it("continues organization creation when language changes", async () => {
    setup("/", true);
    await userEvent.type(await screen.findByLabelText(/^Organisatienaam/), "Testbureau");
    let complete: ((response: Response) => void) | undefined;
    let signal: AbortSignal | undefined;
    intercept = (request) => {
      if (request.method !== "POST") return undefined;
      signal = request.signal;
      return new Promise<Response>((resolve) => {
        complete = resolve;
      });
    };
    await userEvent.click(screen.getByRole("button", { name: "Organisatie aanmaken" }));
    await userEvent.selectOptions(screen.getByLabelText("Taal"), "en-GB");
    expect(signal?.aborted).toBe(false);
    active = org.organizationId;
    if (!complete) throw new Error("Expected pending creation");
    complete(Response.json(org));
    await screen.findByRole("heading", { name: "Your workspace" });
    expect(screen.getAllByText(org.name).length).toBeGreaterThan(0);
  });
  it("discards aborted scoped reads before organization switching", async () => {
    setup("/", true);
    await userEvent.click(await screen.findByRole("radio", { name: new RegExp(org.name) }));
    const fetchMock = vi.mocked(fetch);
    const calls = [...fetchMock.mock.calls];
    const readSignals = calls.map(([input, init]) => (input instanceof Request ? input.signal : init?.signal));
    await userEvent.click(screen.getByRole("button", { name: "Organisatie openen" }));
    await screen.findByRole("heading", { name: "Je werkruimte" });
    expect(readSignals.every((signal) => signal?.aborted)).toBe(true);
  });
});

describe("verification callback stability", () => {
  it("does not verify the same token again when changing language", async () => {
    setup("/e-mail-bevestigen?token=synthetic-verification-token");
    await screen.findByText("Je e-mailadres is bevestigd. Je kunt nu inloggen.");
    const attempts = requests.filter((request) => request.url === "/api/auth/verify-email").length;
    await userEvent.selectOptions(screen.getByLabelText("Taal"), "en-GB");
    await screen.findByText("Your email address is verified. You can now sign in.");
    expect(requests.filter((request) => request.url === "/api/auth/verify-email").length).toBe(attempts);
  });
});

describe("router previews and 404", () => {
  it("keeps dashboard preview context across sidebar navigation without API calls", async () => {
    setup("/?preview=dashboard");
    await userEvent.click(await screen.findByRole("link", { name: "Chat" }));
    const heading = await screen.findByRole("heading", { name: "Chat", level: 1 });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(window.location.pathname).toBe("/apps/chat");
    expect(screen.getByRole("link", { name: "Chat" }).getAttribute("aria-current")).toBe("page");
    expect(requests).toEqual([]);
  });
  it("keeps guest preview transport isolated after navigating to another auth screen", async () => {
    setup("/inloggen?preview=guest");
    await userEvent.click(await screen.findByRole("link", { name: "Registreren" }));
    await screen.findByRole("heading", { name: "Maak je account aan" });
    expect(requests).toEqual([]);
  });
  it("renders dashboard 404 for an unknown preview path", async () => {
    setup("/unknown?preview=dashboard");
    await screen.findByRole("heading", { name: "Pagina niet gevonden", level: 1 });
    expect(screen.getByRole("navigation", { name: "Hoofdnavigatie" })).toBeTruthy();
    expect(requests).toEqual([]);
  });
  it("renders enabled demo auth without a session request, including guest preview", async () => {
    setup("/paginas/authenticatie/gelukt?preview=guest");
    await screen.findByRole("status");
    expect(requests).toEqual([]);
  });
  it("gives dashboard preview precedence over demo auth", async () => {
    setup("/paginas/authenticatie/gelukt?preview=dashboard");
    await screen.findByRole("heading", { name: "Pagina niet gevonden", level: 1 });
    expect(requests).toEqual([]);
  });
});

it("captures callback credentials before Router sees them and discards them on navigation", async () => {
  const factory = vi.spyOn(routing, "createAppRouter");
  try {
    setup("/wachtwoord-herstellen?token=synthetic-private-callback&error=expired");
    await screen.findByRole("alert");
    expect(window.location.search).toBe("");
    const created = factory.mock.results.filter((result) => result.type === "return").map((result) => result.value);
    expect(created.length).toBeGreaterThan(0);
    for (const current of created) {
      expect(JSON.stringify(current.state)).not.toContain("synthetic-private-callback");
      expect(JSON.stringify(current.state)).not.toContain("expired");
      expect(current.options.context).not.toHaveProperty("authProps");
    }
    const router = factory.mock.results.find((result) => result.type === "return")?.value;
    if (!router) throw new Error("Missing test router");
    await router.navigate({ to: "/inloggen" });
    await screen.findByRole("heading", { name: "Welkom terug" });
    await router.navigate({ to: "/wachtwoord-herstellen" });
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "Wachtwoord opslaan" })).toBeNull();
  } finally {
    factory.mockRestore();
  }
});

describe("background cookie revalidation", () => {
  it("keeps the workspace mounted while an unchanged session is checked, and throttles focus", async () => {
    setup("/", true, org.organizationId);
    const navigation = await screen.findByRole("navigation", { name: "Hoofdnavigatie" });
    let complete: ((response: Response) => void) | undefined;
    intercept = (request) =>
      request.url.endsWith("get-session")
        ? new Promise<Response>((resolve) => {
            complete = resolve;
          })
        : undefined;
    const reads = requests.filter((r) => r.url.endsWith("get-session")).length;
    fireEvent.focus(window);
    await waitFor(() => expect(complete).toBeTruthy());
    expect(screen.getByRole("navigation", { name: "Hoofdnavigatie" })).toBe(navigation);
    expect(document.querySelector(".auth-shell")).toBeNull();
    complete?.(
      Response.json({
        user: { emailVerified: true, name: "Robin Voorbeeld", email: "robin@example.test" },
        session: {},
      }),
    );
    await waitFor(() => expect(requests.filter((r) => r.url.endsWith("organizations")).length).toBeGreaterThan(1));
    expect(screen.getByRole("navigation", { name: "Hoofdnavigatie" })).toBe(navigation);
    fireEvent.focus(window);
    fireEvent(document, new Event("visibilitychange"));
    expect(requests.filter((r) => r.url.endsWith("get-session"))).toHaveLength(reads + 1);
    fireEvent.online(window);
    await waitFor(() => expect(requests.filter((r) => r.url.endsWith("get-session"))).toHaveLength(reads + 2));
  });
  it("expires when focus discovers sign-out in another tab", async () => {
    setup("/", true, org.organizationId);
    await screen.findByRole("navigation", { name: "Hoofdnavigatie" });
    signedIn = false;
    fireEvent.focus(window);
    await screen.findByRole("heading", { name: "Welkom terug" });
    expect(screen.queryByRole("navigation", { name: "Hoofdnavigatie" })).toBeNull();
  });
  it("resets when focus discovers a different active organization", async () => {
    setup("/", true, org.organizationId);
    await screen.findByRole("navigation", { name: "Hoofdnavigatie" });
    const second = { ...org, organizationId: "33333333-3333-4333-8333-333333333333", name: "Tweede testbureau" };
    organizations = [org, second];
    active = second.organizationId;
    fireEvent.focus(window);
    await screen.findByRole("button", { name: "Switch organisatie: Tweede testbureau" });
    expect(requests.filter((r) => r.url.endsWith("organizations")).length).toBeGreaterThanOrEqual(3);
  });
});

it("keeps the first-paint auth shell and hero mounted through bootstrap and auth navigation", async () => {
  const { container } = setup();
  const shell = container.querySelector(".auth-shell");
  const photo = container.querySelector(".auth-hero-photo img");
  expect(shell).toBeTruthy();
  expect(photo).toBeTruthy();
  await screen.findByRole("heading", { name: "Welkom terug" });
  expect(container.querySelector(".auth-shell")).toBe(shell);
  await userEvent.click(screen.getByRole("link", { name: "Registreren" }));
  await screen.findByRole("heading", { name: "Maak je account aan" });
  expect(container.querySelector(".auth-shell")).toBe(shell);
  expect(container.querySelector(".auth-hero-photo img")).toBe(photo);
});

it("shows delayed loading feedback and marks main busy during session bootstrap", async () => {
  const session = Promise.withResolvers<Response>();
  setup("/inloggen", false, null, (request) => (request.url.endsWith("get-session") ? session.promise : undefined));
  expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
  expect(screen.queryByRole("progressbar")).toBeNull();
  await screen.findByRole("progressbar", { name: "Pagina laden" });
  session.resolve(Response.json(null));
  await screen.findByRole("form", { name: "Welkom terug" });
  await waitFor(() => expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("false"));
  await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
});

it("shows the bar while a router beforeLoad is pending without rebuilding the auth shell", async () => {
  const factory = vi.spyOn(routing, "createAppRouter");
  try {
    const { container } = setup();
    await screen.findByRole("form", { name: "Welkom terug" });
    const shell = container.querySelector(".auth-shell");
    const router = factory.mock.results.find((result) => result.type === "return")?.value;
    if (!router) throw new Error("Missing test router");
    const session = Promise.withResolvers<void>();
    router.routeTree.options.beforeLoad = async () => {
      await session.promise;
      return { session: { kind: "guest" as const } };
    };
    const navigating = router.navigate({ to: "/registreren" });
    await screen.findByRole("progressbar", { name: "Pagina laden" });
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(container.querySelector(".auth-shell")).toBe(shell);
    session.resolve();
    await navigating;
    await screen.findByRole("form", { name: "Maak je account aan" });
    await waitFor(() => expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("false"));
  } finally {
    factory.mockRestore();
  }
});
