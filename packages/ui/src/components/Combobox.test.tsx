import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Combobox } from "./Combobox.tsx";
import { axeViolations } from "../test-utils.ts";

function ComboboxExample() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <Combobox
      label="Tags"
      multiple
      value={value}
      onChange={setValue}
      options={[{ value: "tech", label: "Techniek" }]}
      emptyLabel="Geen opties"
      removeLabel={(n) => `Verwijder ${n}`}
    />
  );
}

describe("Combobox", () => {
  it("filters, navigates, selects and dismisses without moving input focus", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <Combobox
        label="Bron"
        options={[
          { value: "ref", label: "Referral" },
          { value: "web", label: "Website" },
        ]}
        value={[]}
        onChange={change}
        emptyLabel="Geen opties"
        removeLabel={(n) => `Verwijder ${n}`}
      />,
    );
    const input = screen.getByRole<HTMLInputElement>("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{End}{Enter}");
    expect(change).toHaveBeenCalledWith(["web"]);
    await user.click(input);
    await user.type(input, "zz");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
    await user.keyboard("{Escape}");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
  it("supports removable multi selection", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <Combobox
        label="Bron"
        multiple
        options={[{ value: "ref", label: "Referral" }]}
        value={["ref"]}
        onChange={change}
        emptyLabel="Geen opties"
        removeLabel={(n) => `Verwijder ${n}`}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Verwijder Referral" }));
    expect(change).toHaveBeenCalledWith([]);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("skips disabled options, preserves selection on Escape, and closes on Tab", async () => {
    const user = userEvent.setup(),
      change = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <Combobox
        label="Bron"
        value={["ref"]}
        onChange={change}
        options={[
          { value: "ref", label: "Referral" },
          { value: "blocked", label: "Archief", disabled: true },
          { value: "web", label: "Website" },
        ]}
        emptyLabel="Geen opties"
        removeLabel={(n) => `Verwijder ${n}`}
      />,
    );
    const input = screen.getByRole<HTMLInputElement>("combobox");
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent).toContain(
      "Website",
    );
    expect(document.activeElement).toBe(input);
    expect(await axeViolations(container)).toEqual([]);
    await user.keyboard("{Escape}");
    expect(input.value).toBe("Referral");
    expect(change).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}{Tab}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
  it("toggles multi-select options while retaining input focus", async () => {
    const user = userEvent.setup();

    const { container } = render(<ComboboxExample />);
    const input = screen.getByRole<HTMLInputElement>("combobox");
    await user.tab();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("option").getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Verwijder Techniek" })).toBeDefined();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("option").getAttribute("aria-selected")).toBe("false");
    expect(document.activeElement).toBe(input);
    expect(await axeViolations(container)).toEqual([]);
  });
});
