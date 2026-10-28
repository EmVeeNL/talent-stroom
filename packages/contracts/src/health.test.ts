import { describe, expect, it } from "vitest";
import { HealthResponse } from "./health.ts";

describe("HealthResponse", () => {
  it("accepts a healthy response", () => {
    expect(HealthResponse.parse({ status: "ok", service: "api" })).toEqual({ status: "ok", service: "api" });
  });

  it("rejects an unknown status", () => {
    expect(HealthResponse.safeParse({ status: "down", service: "api" }).success).toBe(false);
  });
});
