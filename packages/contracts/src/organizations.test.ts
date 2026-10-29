import { describe, expect, it } from "vitest";
import { CreateOrganizationRequest, MembershipRole, MyOrganizationsResponse, OrganizationContext } from "./index.ts";

const id = "6f1c1a52-7b1e-4c55-9d2f-0c8f4d2a9b10";

describe("organization contracts", () => {
  it("accepts only the four organization roles", () => {
    expect(MembershipRole.options).toEqual(["owner", "admin", "recruiter", "viewer"]);
    expect(MembershipRole.safeParse("member").success).toBe(false);
  });

  it("trims and bounds organization names", () => {
    expect(CreateOrganizationRequest.parse({ name: "  Bureau A  " })).toEqual({ name: "Bureau A" });
    expect(CreateOrganizationRequest.safeParse({ name: " a " }).success).toBe(false);
    expect(CreateOrganizationRequest.safeParse({ name: "x".repeat(101) }).success).toBe(false);
  });

  it("allows no active organization yet", () => {
    expect(MyOrganizationsResponse.parse({ activeOrganizationId: null, organizations: [] })).toEqual({
      activeOrganizationId: null,
      organizations: [],
    });
  });

  it("requires uuid identifiers in the organization context", () => {
    const context = { organizationId: id, membershipId: id, name: "Bureau A", role: "owner" };
    expect(OrganizationContext.parse(context)).toEqual(context);
    expect(OrganizationContext.safeParse({ ...context, organizationId: "bureau-a" }).success).toBe(false);
  });
});
