import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

const env: Env = { SERVICE_NAME: "api" };

describe("api", () => {
  it("GET /health reports ok", async () => {
    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", service: "api" });
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("unknown routes return a problem response", async () => {
    const res = await app.request("/nope", {}, env);
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
  });
});
