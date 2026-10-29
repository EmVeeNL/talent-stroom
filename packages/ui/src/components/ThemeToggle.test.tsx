import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { ThemeToggle } from "./ThemeToggle.tsx";
const labels = { system: "Systeem", light: "Licht", dark: "Donker" };
it("uses native radio keyboard navigation and persists preference", async () => {
  render(<ThemeToggle label="Thema" labels={labels} />);
  await userEvent.click(screen.getByRole("radio", { name: "Licht" }));
  await userEvent.keyboard("{ArrowRight}");
  expect(localStorage.getItem("ts-theme")).toBe("dark");
  expect(document.documentElement.dataset["theme"]).toBe("dark");
});
it("has no axe violations", async () => {
  const { container } = render(<ThemeToggle label="Thema" labels={labels} />);
  expect(await axeViolations(container)).toEqual([]);
});
it("keeps the selected theme applied when storage is blocked", async () => {
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  render(<ThemeToggle label="Thema" labels={labels} />);
  await userEvent.click(screen.getByRole("radio", { name: "Donker" }));
  expect(document.documentElement.dataset["theme"]).toBe("dark");
  expect(screen.getByRole("radio", { name: "Donker" }).matches(":checked")).toBe(true);
  write.mockRestore();
  read.mockRestore();
});
it("applies preferences changed in another tab", async () => {
  const { container } = render(<ThemeToggle label="Thema" labels={labels} />);
  await act(async () => {
    localStorage.setItem("ts-theme", "light");
    window.dispatchEvent(new StorageEvent("storage", { key: "ts-theme", newValue: "light" }));
  });
  expect(document.documentElement.dataset["theme"]).toBe("light");
  expect(screen.getByRole("radio", { name: "Licht" }).matches(":checked")).toBe(true);
  expect(await axeViolations(container)).toEqual([]);
});
