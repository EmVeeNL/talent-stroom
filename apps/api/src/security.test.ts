import { createRoute, z } from "@hono/zod-openapi";
import { ProblemDetails, PROBLEM_BASE_URI } from "@talentstroom/contracts";
import { describe, expect, it, vi } from "vitest";
import { app, createApp } from "./app.ts";
import { testEnv as env } from "./test-env.ts";

const maxSize = 1024 * 1024;

function testApp() {
  const test = createApp();
  test.get("/ok", (c) => c.json({ ok: true }));
  test.get("/public", (c) => c.json({ version: 1 }, 200, { "Cache-Control": "public, max-age=60" }));
  test.get("/throw", () => {
    throw new Error("synthetic failure");
  });
  test.get("/public-error", (c) => {
    c.header("Cache-Control", "public, max-age=60");
    throw new Error("synthetic failure");
  });
  test.get("/banners", (c) => c.text("ok", 200, { Server: "synthetic", "X-Powered-By": "synthetic" }));
  test.post("/body", async (c) => c.json({ size: (await c.req.arrayBuffer()).byteLength }));
  test.openapi(
    createRoute({
      method: "post",
      path: "/validate",
      request: { body: { content: { "application/json": { schema: z.object({ ok: z.literal(true) }) } } } },
      responses: { 200: { description: "Test only" } },
    }),
    (c) => c.json({ ok: true }),
  );
  return test;
}

function expectSecurityHeaders(res: Response) {
  for (const [header, value] of Object.entries({
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  })) {
    expect(res.headers.get(header)).toBe(value);
  }
  for (const feature of ["camera", "microphone", "geolocation", "payment", "usb", "display-capture"]) {
    expect(res.headers.get("Permissions-Policy")).toContain(`${feature}=()`);
  }
  expect(res.headers.has("X-Powered-By")).toBe(false);
  expect(res.headers.has("Server")).toBe(false);
}

describe("API security policy", () => {
  it.each([
    ["/ok", "GET", undefined, 200],
    ["/missing", "GET", undefined, 404],
    ["/validate", "POST", '{"ok":false}', 422],
    ["/throw", "GET", undefined, 500],
    ["/public-error", "GET", undefined, 500],
  ] as const)("protects %s responses", async (path, method, body, status) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await testApp().request(
        path,
        { method, ...(body === undefined ? {} : { body }), headers: { "Content-Type": "application/json" } },
        env,
      );
      expect(res.status).toBe(status);
      expectSecurityHeaders(res);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    } finally {
      log.mockRestore();
    }
  });

  it("keeps health uncached and preserves an explicit public route policy", async () => {
    expect((await app.request("/health", {}, env)).headers.get("Cache-Control")).toBe("no-store");
    const res = await testApp().request("/public", {}, env);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
    expectSecurityHeaders(res);
  });

  it("removes application server banners", async () => {
    const res = await testApp().request("/banners", {}, env);
    expect(res.status).toBe(200);
    expectSecurityHeaders(res);
  });

  it.each(["GET", "OPTIONS"])("does not grant cross-origin access for %s", async (method) => {
    const res = await testApp().request(
      "/ok",
      {
        method,
        headers: {
          Origin: "https://external.example",
          ...(method === "OPTIONS"
            ? { "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" }
            : {}),
        },
      },
      env,
    );
    expect([...res.headers.keys()].filter((name) => name.startsWith("access-control-allow-"))).toEqual([]);
    expectSecurityHeaders(res);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it.each([true, false])(
    "rejects more than 1 MiB (Content-Length: %s) with a correlated problem",
    async (withLength) => {
      const res = await testApp().request(
        "/body",
        {
          method: "POST",
          body: "x".repeat(maxSize + 1),
          headers: withLength ? { "Content-Length": String(maxSize + 1) } : {},
        },
        env,
      );
      expect(res.status).toBe(413);
      expect(res.headers.get("Content-Type")).toContain("application/problem+json");
      expect(ProblemDetails.parse(await res.json())).toEqual({
        type: `${PROBLEM_BASE_URI}/payload-too-large`,
        title: "Verzoek te groot",
        status: 413,
        requestId: res.headers.get("X-Request-Id"),
      });
      expectSecurityHeaders(res);
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    },
  );

  it.each([true, false])("accepts exactly 1 MiB and preserves body bytes (Content-Length: %s)", async (withLength) => {
    const res = await testApp().request(
      "/body",
      { method: "POST", body: "x".repeat(maxSize), headers: withLength ? { "Content-Length": String(maxSize) } : {} },
      env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ size: maxSize });
  });
});
