import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { NotificationCentre } from "./notifications.tsx";

const renderCentre = () => render(<NotificationCentre locale="nl-NL" demo />);
const open = async () => {
  const bell = screen.getByRole("button", { name: "Meldingen: 5 ongelezen" });
  await userEvent.click(bell);
  return { bell, panel: screen.getByRole("dialog", { name: "Meldingen" }) };
};
describe("notification centre", () => {
  it("shows five synthetic types, marks one/all read and restores focus on Escape", async () => {
    renderCentre();
    const { bell, panel } = await open();
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(within(panel).getAllByRole("listitem")).toHaveLength(5);
    const first = within(panel).getAllByRole("button", { name: /Markeer als gelezen/ })[0];
    if (!first) throw new Error("Expected unread item");
    await userEvent.click(first);
    expect(screen.getByRole("button", { name: "Meldingen: 4 ongelezen" })).toBeDefined();
    await userEvent.click(within(panel).getByRole("button", { name: "Alles als gelezen markeren" }));
    expect(screen.getByRole("button", { name: "Meldingen: 0 ongelezen" })).toBeDefined();
    fireEvent(panel, new Event("cancel", { cancelable: true }));
    expect(document.activeElement).toBe(bell);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("provides generic deep links and marks the selected item read", async () => {
    renderCentre();
    const { panel } = await open();
    const link = within(panel).getByRole("link", { name: "Demo-afspraak begint binnenkort" });
    expect(link.getAttribute("href")).toBe("/apps/agenda");
    // Prevent jsdom navigation while exercising the activation handler.
    link.addEventListener("click", (event) => event.preventDefault());
    await userEvent.click(link);
    expect(screen.getByRole("button", { name: "Meldingen: 4 ongelezen" })).toBeDefined();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("applies per-type preferences and configurable appointment lead time in memory", async () => {
    renderCentre();
    const { panel } = await open();
    await userEvent.click(within(panel).getByRole("button", { name: "Meldingsvoorkeuren" }));
    const settings = screen.getByRole("dialog", { name: "Meldingsvoorkeuren" });
    await userEvent.click(within(settings).getByRole("checkbox", { name: "Nieuwe berichten" }));
    await userEvent.selectOptions(within(settings).getByRole("combobox", { name: "Herinnering vóór afspraak" }), "5");
    await userEvent.click(within(settings).getByRole("button", { name: "Sluiten" }));
    await userEvent.click(screen.getByRole("button", { name: "Meldingen: 3 ongelezen" }));
    expect(within(screen.getByRole("dialog")).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("link", { name: "Nieuw demobericht" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Demo-afspraak begint binnenkort" })).toBeNull();
  });
  it("announces newly due items without opening the panel", () => {
    vi.useFakeTimers();
    try {
      renderCentre();
      expect(screen.getByRole("status").textContent).toBe("");
      act(() => {
        vi.advanceTimersByTime(61_000);
      });
      expect(screen.getByRole("status").textContent).toBe("1 nieuwe melding(en)");
      expect(screen.getByRole("button", { name: "Meldingen: 6 ongelezen" })).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });
  it("announces new items inside the open modal and leaves arrivals unread after mark all", () => {
    vi.useFakeTimers();
    try {
      renderCentre();
      fireEvent.click(screen.getByRole("button", { name: "Meldingen: 5 ongelezen" }));
      const panel = screen.getByRole("dialog");
      fireEvent.click(within(panel).getByRole("button", { name: "Alles als gelezen markeren" }));
      act(() => {
        vi.advanceTimersByTime(61_000);
      });
      expect(within(panel).getByRole("status").textContent).toBe("1 nieuwe melding(en)");
      expect(screen.getByRole("button", { name: "Meldingen: 1 ongelezen" })).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });
  it("delivers an appointment when it enters the selected lead window and removes it after starting", () => {
    vi.useFakeTimers();
    try {
      renderCentre();
      fireEvent.click(screen.getByRole("button", { name: "Meldingen: 5 ongelezen" }));
      fireEvent.click(screen.getByRole("button", { name: "Meldingsvoorkeuren" }));
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "5" } });
      fireEvent.click(screen.getByRole("button", { name: "Sluiten" }));
      expect(screen.getByRole("button", { name: "Meldingen: 4 ongelezen" })).toBeDefined();
      act(() => {
        vi.advanceTimersByTime(5 * 60_000);
      });
      expect(screen.getByRole("button", { name: "Meldingen: 6 ongelezen" })).toBeDefined();
      act(() => {
        vi.advanceTimersByTime(5 * 60_000);
      });
      expect(screen.getByRole("button", { name: "Meldingen: 5 ongelezen" })).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });
  it("has labelled keyboard controls and no detectable accessibility violations", async () => {
    renderCentre();
    const bell = screen.getByRole("button", { name: "Meldingen: 5 ongelezen" });
    bell.focus();
    await userEvent.keyboard("{Enter}");
    const panel = screen.getByRole("dialog");
    expect((await axe.run(panel)).violations).toEqual([]);
    await userEvent.tab();
    expect(panel.contains(document.activeElement)).toBe(true);
  });
  it("shows an empty production panel and resets when the owning scope remounts", async () => {
    const view = renderCentre();
    const { panel } = await open();
    await userEvent.click(within(panel).getByRole("button", { name: "Alles als gelezen markeren" }));
    view.rerender(<NotificationCentre key="other-synthetic-scope" locale="en-GB" demo />);
    expect(screen.getByRole("button", { name: "Notifications: 5 unread" })).toBeDefined();
    view.rerender(<NotificationCentre key="production" locale="en-GB" demo={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Notifications: 0 unread" }));
    expect(screen.getByText("You're all caught up.")).toBeDefined();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
