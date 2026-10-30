import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElementsIcons } from "./ElementSections.tsx";

const writeText = vi.fn<(name: string) => Promise<void>>();
beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

describe("icon gallery", () => {
  it("filters the self-hosted icon names and copies the selected ligature", async () => {
    render(<ElementsIcons locale="nl-NL" />);
    const search = screen.getByRole("textbox", { name: "Iconen zoeken" });
    fireEvent.change(search, { target: { value: "calendar" } });
    const iconButton = screen.getByRole("button", { name: "calendar_month Iconen zoeken" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(iconButton);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("calendar_month"));
    expect(screen.getByText("Icoonnaam gekopieerd.")).toBeTruthy();
  });
});
