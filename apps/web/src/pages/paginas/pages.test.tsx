import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Locale } from "@talentstroom/i18n";
import ContactPage from "./Contact.tsx";
import VeelgesteldeVragenPage from "./VeelgesteldeVragen.tsx";
const locale: Locale = "nl-NL";
describe("Pages demo interactions", () => {
  it("filters FAQ disclosures by search text", () => {
    render(<VeelgesteldeVragenPage locale={locale} />);
    expect(screen.getByText("Hoe maak ik een account aan?")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "btw" } });
    expect(screen.getByText("Zijn de prijzen inclusief btw?")).toBeTruthy();
    expect(screen.queryByText("Hoe maak ik een account aan?")).toBeNull();
  });
  it("shows a local demo confirmation after valid contact submission", () => {
    render(<ContactPage locale={locale} />);
    fireEvent.change(screen.getByLabelText("Naam"), { target: { value: "Mila Voorbeeld" } });
    fireEvent.change(screen.getByLabelText("E-mailadres"), { target: { value: "mila@voorbeeld.nl" } });
    fireEvent.change(screen.getByLabelText("Onderwerp"), { target: { value: "Algemene vraag" } });
    fireEvent.change(screen.getByLabelText("Bericht"), { target: { value: "Ik heb een korte vraag." } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Bericht versturen" }));
    expect(screen.getByRole("status").textContent).toContain("Er is niets verstuurd");
  });
});
