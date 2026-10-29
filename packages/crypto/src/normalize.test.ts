import { describe, expect, it } from "vitest";
import { NormalizationError } from "./errors.ts";
import { normalizeEmail, normalizePhone } from "./normalize.ts";

describe("normalizeEmail", () => {
  it.each([
    ["  Test@Example.NL ", "test@example.nl"],
    ["first.last+tag@example.nl", "first.last+tag@example.nl"],
    ["t.e.s.t@gmail.com", "t.e.s.t@gmail.com"], // no provider-specific dot stripping
    ["José@example.nl", "josé@example.nl"], // NFC: decomposed é becomes precomposed
    ["ÉLODIE@Example.nl", "élodie@example.nl"],
  ])("normalizes %j", (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "no-at-sign.nl",
    "@example.nl",
    "a@@example.nl",
    "a@b@example.nl",
    "a@localhost",
    "a@example..nl",
    "a@-example.nl",
    "a b@example.nl",
    "a@exa​mple.nl",
    '"quoted"@example.nl',
    `${"a".repeat(250)}@example.nl`,
  ])("rejects %j", (input) => {
    expect(() => normalizeEmail(input)).toThrow(NormalizationError);
  });
});

describe("normalizePhone", () => {
  it.each([
    ["06 12345678", "+31612345678"],
    ["06-12 34 56 78", "+31612345678"],
    ["0612345678", "+31612345678"],
    ["+31 6 12345678", "+31612345678"],
    ["+31612345678", "+31612345678"],
    ["0031 6 1234 5678", "+31612345678"],
    ["+31 (0)6 12345678", "+31612345678"],
    ["+31 06 12345678", "+31612345678"],
    ["020-1234567", "+31201234567"],
    ["(020) 123 45 67", "+31201234567"],
    ["010.123.4567", "+31101234567"],
    ["085 123 4567", "+31851234567"],
    ["０６１２３４５６７８", "+31612345678"], // full-width digits
    ["+32 470 12 34 56", "+32470123456"],
    ["0049 30 1234567", "+49301234567"],
    ["+44 (0)20 7946 0000", "+442079460000"],
  ])("normalizes %j", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "",
    "612345678", // no prefix: ambiguous
    "06 1234567", // too short
    "06 123456789", // too long
    "+31 6 1234567", // too short
    "+31 6 123456789", // too long
    "0800 1234", // service number with other length
    "00 0612345678", // international prefix followed by a trunk zero
    "+0 123456789",
    "+1 234", // too short
    "+123 4567 8901 2345 6", // longer than E.164
    "06 1234 5678 ext. 12",
    "06-CALL-ME",
    "+31 6 12345678 / +31 6 87654321",
    "++31612345678",
    `06${"1".repeat(70)}`,
  ])("rejects %j", (input) => {
    expect(() => normalizePhone(input)).toThrow(NormalizationError);
  });
});
