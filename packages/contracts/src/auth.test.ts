import { describe, expect, it } from "vitest";
import { AuthEmailRequest, NewPasswordRequest, SignInRequest, SignUpRequest } from "./index.ts";

describe("auth request schemas", () => {
  it("keeps passwords byte-for-byte and strips presentation fields", () => {
    const password = "  synthetic-password  ";
    expect(
      SignUpRequest.parse({ name: "Test Recruiter", email: "synthetic@example.test", password, terms: true }),
    ).toEqual({ name: "Test Recruiter", email: "synthetic@example.test", password });
    expect(SignInRequest.parse({ email: "synthetic@example.test", password: "x" }).password).toBe("x");
  });
  it("validates email and new-password limits", () => {
    expect(AuthEmailRequest.safeParse({ email: "invalid" }).success).toBe(false);
    expect(NewPasswordRequest.safeParse({ password: "short" }).success).toBe(false);
    expect(NewPasswordRequest.safeParse({ password: "x".repeat(129) }).success).toBe(false);
  });
});
