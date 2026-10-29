import { z } from "@hono/zod-openapi";
import { ProblemDetails, PROBLEMS } from "@talentstroom/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app as prodApp, createApp } from "./app.ts";
import { authAttemptLimit } from "./rate-limit.ts";
import { fakeRateLimit, testEnv } from "./test-env.ts";

const ip = "203.0.113.7";

function run(path: string, anon: ReturnType<typeof fakeRateLimit>, headers: Record<string, string> = {}) {
  const app = createApp();
  app.get("/ok", (c) => c.json({ ok: true }));
  return app.request(path, { headers }, { ...testEnv, RATE_LIMIT_ANON: anon });
}

afterEach(() => vi.restoreAllMocks());

// Imported for its side effect of extending zod before contracts load.
void z;

describe("global anonymous rate limit", () => {
  it("passes requests when under the limit", async () => {
    expect((await run("/ok", fakeRateLimit("allow"))).status).toBe(200);
  });

  it("returns a 429 problem with Retry-After and security headers", async () => {
    const res = await run("/ok", fakeRateLimit("limit"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(res.headers.get("Content-Type")).toContain("application/problem+json");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = ProblemDetails.parse(await res.json());
    expect(body.type).toBe(PROBLEMS.tooManyRequests.type);
    expect(body.status).toBe(429);
  });

  it("keys on a SHA-256 of the IP, never the raw IP", async () => {
    const anon = fakeRateLimit("allow");
    await run("/ok", anon, { "CF-Connecting-IP": ip });
    expect(anon.keys).toHaveLength(1);
    expect(anon.keys[0]).toMatch(/^RATE_LIMIT_ANON:[0-9a-f]{64}$/);
    expect(anon.keys[0]).not.toContain(ip);
  });

  it("uses a fixed key without CF-Connecting-IP", async () => {
    const anon = fakeRateLimit("allow");
    await run("/ok", anon);
    await run("/ok", anon);
    expect(anon.keys).toEqual(["RATE_LIMIT_ANON:no-ip", "RATE_LIMIT_ANON:no-ip"]);
  });

  it("excludes /health", async () => {
    const anon = fakeRateLimit("limit");
    const res = await prodApp.request("/health", {}, { ...testEnv, RATE_LIMIT_ANON: anon });
    expect(res.status).toBe(200);
    expect(anon.keys).toHaveLength(0);
  });

  it("fails open when the binding throws, logging no IP", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await run("/ok", fakeRateLimit("throw"), { "CF-Connecting-IP": ip });
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).not.toContain(ip);
  });
});

function authApp(binding: ReturnType<typeof fakeRateLimit>) {
  const app = createApp();
  app.post("/auth", authAttemptLimit, (c) => c.json({ ok: true }));
  return (headers: Record<string, string> = {}) =>
    app.request("/auth", { method: "POST", headers }, { ...testEnv, RATE_LIMIT_AUTH_ATTEMPT: binding });
}

describe("auth attempt limiter", () => {
  it("rejects when limited", async () => {
    expect((await authApp(fakeRateLimit("limit"))()).status).toBe(429);
  });

  it("fails closed when the binding throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await authApp(fakeRateLimit("throw"))();
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("allows when under the limit with a hashed key", async () => {
    const binding = fakeRateLimit("allow");
    expect((await authApp(binding)({ "CF-Connecting-IP": ip })).status).toBe(200);
    expect(binding.keys[0]).toMatch(/^RATE_LIMIT_AUTH_ATTEMPT:[0-9a-f]{64}$/);
  });
});
