import { describe, expect, it } from "vitest";
import { CRM_DEALS } from "../../../demo/apps.ts";
import { formatEuro, openValue, wonValue } from "./format.ts";

describe("crm format", () => {
  it("formats whole euros in nl-NL", () => {
    expect(formatEuro(18500).replace(/\s/g, " ")).toBe("€ 18.500");
  });

  it("sums open and won deals separately", () => {
    expect(wonValue(CRM_DEALS)).toBe(24750 + 31400);
    expect(openValue(CRM_DEALS)).toBe(18500 + 42000 + 9500 + 15200 + 11250);
  });
});
