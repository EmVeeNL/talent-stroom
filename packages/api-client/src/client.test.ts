import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient, type ProblemDetails } from "./index.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createApiClient", () => {
  it("builds a request URL from the configured base URL", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "ok", service: "talentstroom-api" }));
    vi.stubGlobal("fetch", fetchMock);

    const client = createApiClient({ baseUrl: "https://api.example.test/v1" });
    const result = await client.GET("/health");

    expect(result.data).toEqual({ status: "ok", service: "talentstroom-api" });
    const request = fetchMock.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    expect(request).toMatchObject({
      url: "https://api.example.test/v1/health",
      credentials: "same-origin",
    });
  });

  it("parses a successful health response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: "ok", service: "talentstroom-api" })),
    );

    const client = createApiClient({ baseUrl: "https://api.example.test/api" });
    const result = await client.GET("/health");

    expect(result.data?.status).toBe("ok");
    expect(result.error).toBeUndefined();
  });

  it("surfaces problem+json errors as typed problem details", async () => {
    const problem = {
      type: "https://talentstroom.dev/problems/internal-error",
      title: "Internal Server Error",
      status: 500,
      requestId: "req_test_123",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json(problem, {
          status: 500,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    const client = createApiClient({ baseUrl: "https://api.example.test/api" });
    const result = await client.GET("/health");

    const error: ProblemDetails | undefined = result.error;
    expect(error).toEqual(problem);
  });
});
