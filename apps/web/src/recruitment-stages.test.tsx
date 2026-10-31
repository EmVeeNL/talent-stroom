import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { t } from "@talentstroom/i18n";
import { StageBadge, RECRUITMENT_STAGE_IDS } from "@talentstroom/ui";
it("offers a localized rejected stage with a subtle danger tone", () => {
  expect(RECRUITMENT_STAGE_IDS).toContain("afgewezen");
  render(<StageBadge stage="afgewezen">{t("nl-NL", "recruitment.stage.afgewezen")}</StageBadge>);
  expect(screen.getByText("Afgewezen").className).toContain("ts-badge--danger");
  expect(screen.getByText("Afgewezen").className).toContain("ts-badge--subtle");
  expect(t("en-GB", "recruitment.stage.afgewezen")).toBe("Rejected");
});
