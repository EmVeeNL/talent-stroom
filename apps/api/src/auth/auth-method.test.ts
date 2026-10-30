import { describe, expect, it } from "vitest";
import { satisfiesMfa, signInMethod } from "./auth-method.ts";

describe("satisfiesMfa (ADR 0006 owner decision 2)", () => {
  it.each(["passkey", "password+totp", "social:google+totp", "social:apple+totp", "social:microsoft+totp"])(
    "accepts %s",
    (method) => expect(satisfiesMfa(method)).toBe(true),
  );
  it.each([
    null,
    undefined,
    "",
    "password",
    "social:google",
    "social:apple",
    "social:microsoft",
    "totp",
    "social:unknown+totp",
    "password+backup-code",
    "PASSWORD+TOTP",
    "passkey+totp",
    " password+totp",
    "password+totp ",
    "unknown",
    "unknown+totp",
  ])("rejects %s", (method) => expect(satisfiesMfa(method)).toBe(false));
});

describe("signInMethod", () => {
  it.each([
    ["/sign-in/email", undefined, "password"],
    ["/sign-up/email", undefined, "password"],
    ["/passkey/verify-authentication", undefined, "passkey"],
    ...["google", "apple", "microsoft"].flatMap((provider) => [
      [`/callback/${provider}`, undefined, `social:${provider}`] as const,
      ["/sign-in/social", provider, `social:${provider}`] as const,
    ]),
    ["/callback/unknown", undefined, null],
    ["/get-session", "google", null],
    ["/two-factor/verify-backup-code", undefined, null],
    ["/callback/google/extra", undefined, null],
  ] as const)("%s with %s records %s", (path, provider, method) => {
    expect(signInMethod(path ?? "", provider)).toBe(method);
  });
});
