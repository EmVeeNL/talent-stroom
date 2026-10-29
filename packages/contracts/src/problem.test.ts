import { describe, expect, it } from "vitest";
import { ProblemDetails, ValidationProblem, PROBLEMS } from "./index.ts";

describe("problem contracts", () => {
  const problem = { type: PROBLEMS.notFound.type, title: "Niet gevonden", status: 404, requestId: "synthetic-request" };
  it("accepts problem details with optional RFC fields", () => {
    expect(ProblemDetails.parse(problem)).toEqual(problem);
    expect(
      ProblemDetails.safeParse({ ...problem, detail: "Synthetic detail", instance: "urn:request:synthetic" }).success,
    ).toBe(true);
  });
  it("requires a valid HTTP error status and correlation id", () => {
    expect(ProblemDetails.safeParse({ ...problem, status: 200 }).success).toBe(false);
    expect(ProblemDetails.safeParse({ ...problem, requestId: "" }).success).toBe(false);
  });
  it("requires field errors on a validation problem", () => {
    const validation = { ...problem, type: PROBLEMS.validationError.type, status: 422 };
    expect(ValidationProblem.safeParse(validation).success).toBe(false);
    expect(
      ValidationProblem.safeParse({ ...validation, errors: [{ path: "body", message: "Ongeldige waarde" }] }).success,
    ).toBe(true);
  });
});
