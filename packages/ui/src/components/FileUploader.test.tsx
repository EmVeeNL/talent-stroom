import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { FileUploader } from "./FileUploader.tsx";
import { axeViolations } from "../test-utils.ts";
const labels = {
  chooseLabel: "Bestand kiezen",
  removeLabel: (n: string) => `${n} verwijderen`,
  wrongTypeMessage: (n: string) => `${n} verkeerd type`,
  tooLargeMessage: (n: string) => `${n} te groot`,
};
describe("FileUploader", () => {
  it("reports invalid file size", async () => {
    render(<FileUploader label="CV" accept=".pdf" maxSize={10} {...labels} />);
    await userEvent.upload(
      screen.getByLabelText("CV"),
      new File(["123456789012"], "cv.pdf", { type: "application/pdf" }),
    );
    expect(screen.getByRole("alert").textContent).toContain("te groot");
  });
  it("passes axe", async () => {
    const { container } = render(<FileUploader label="CV" {...labels} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
