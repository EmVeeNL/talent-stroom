import { createRoute, z } from "@hono/zod-openapi";
import { ProblemDetails, ValidationProblem, PROBLEM_BASE_URI } from "@talentstroom/contracts";
import { describe, expect, it, vi } from "vitest";
import { app, createApp, openapiConfig } from "./app.ts";
import { version } from "../package.json";
import committedDocument from "../openapi.json";

const env: Env = { SERVICE_NAME: "api", ENVIRONMENT: "development" };

function testApp() {
  const test = createApp();
  test.get("/throw", () => {
    throw new Error("synthetic-private-value");
  });
  test.openapi(
    createRoute({
      method: "post",
      path: "/validate",
      request: {
        body: {
          required: true,
          content: { "application/json": { schema: z.object({ choice: z.literal("allowed") }) } },
        },
        query: z.object({ count: z.coerce.number().int() }),
      },
      responses: { 200: { description: "Test only" } },
    }),
    (c) => c.json({ ok: true }),
  );
  return test;
}

describe("api", () => {
  it("GET /health reports ok", async () => {
    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "api" });
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("unknown routes return a correlated 404 without reflecting the URL", async () => {
    const res = await app.request("/synthetic-private-value", {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
    expect(ProblemDetails.parse(await res.json())).toEqual({
      type: `${PROBLEM_BASE_URI}/not-found`,
      title: "Niet gevonden",
      status: 404,
      requestId: res.headers.get("X-Request-Id"),
    });
  });

  it("returns a generic 500 and logs no exception details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await testApp().request("/throw", {}, env);
      expect(res.status).toBe(500);
      expect(res.headers.get("Content-Type")).toContain("application/problem+json");
      expect(ProblemDetails.parse(await res.json())).toEqual({
        type: `${PROBLEM_BASE_URI}/internal-error`,
        title: "Interne serverfout",
        status: 500,
        requestId: res.headers.get("X-Request-Id"),
      });
      expect(log).toHaveBeenCalledOnce();
      expect(JSON.stringify(log.mock.calls)).not.toContain("synthetic-private-value");
    } finally {
      log.mockRestore();
    }
  });

  it.each([
    ["/validate?count=1", '{"choice":"synthetic-private-value"}', 422, "validation-error"],
    ["/validate?count=synthetic-private-value", '{"choice":"allowed"}', 422, "validation-error"],
    ["/validate?count=1", '{"choice":', 400, "malformed-json"],
  ])("validates request case %s", async (url, body, status, type) => {
    const res = await testApp().request(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
      env,
    );
    expect(res.status).toBe(status);
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
    const text = await res.text();
    expect(text).not.toContain("synthetic-private-value");
    const schema = status === 422 ? ValidationProblem : ProblemDetails;
    const problem = schema.parse(JSON.parse(text));
    expect(problem.type).toBe(`${PROBLEM_BASE_URI}/${type}`);
    expect(problem.requestId).toBe(res.headers.get("X-Request-Id"));
  });

  it("generates OpenAPI 3.1 with health and reusable problem components", () => {
    const doc = app.getOpenAPI31Document(openapiConfig);
    expect(doc).toEqual(committedDocument);
    expect(doc.openapi).toMatch(/^3\.1\./);
    expect(doc.info).toEqual({ title: "TalentStroom API", version });
    expect(doc.servers).toEqual([{ url: "/" }]);
    expect(doc.paths?.["/health"]?.get?.responses?.["200"]).toBeDefined();
    expect(doc.components?.schemas).toHaveProperty("ProblemDetails");
    expect(doc.components?.schemas).toHaveProperty("ValidationProblem");
    for (const name of ["NotFound", "InternalError", "ValidationError", "MalformedJson"]) {
      expect(doc.components?.responses).toHaveProperty(name);
    }
    expect(doc.paths).not.toHaveProperty("/validate");
  });

  it("serves the document only in development", async () => {
    expect((await app.request("/openapi.json", {}, env)).status).toBe(200);
    expect((await app.request("/openapi.json", {}, { ...env, ENVIRONMENT: "production" })).status).toBe(404);
  });
});
