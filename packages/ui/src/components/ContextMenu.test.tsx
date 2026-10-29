import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContextMenu } from "./ContextMenu.tsx";
import { axeViolations } from "../test-utils.ts";

describe("ContextMenu", () => {
  it("supports arrows, Home/End, typeahead, disabled items, activation and focus return", async () => {
    const user = userEvent.setup();
    const select = vi.fn<() => void>();
    render(
      <ContextMenu
        triggerLabel="Meer acties"
        items={[
          { id: "refresh", label: "Vernieuwen", onSelect: select },
          { id: "export", label: "Exporteren", disabled: true, onSelect: select },
          { id: "separator", separator: true },
          { id: "copy", label: "Dupliceren", onSelect: select },
          { id: "delete", label: "Verwijderen", tone: "danger", onSelect: select },
        ]}
      />,
    );
    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.textContent).toBe("Vernieuwen");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement?.textContent).toBe("Exporteren");
    await user.keyboard("{Enter}");
    expect(select).not.toHaveBeenCalled();
    await user.keyboard("{End}");
    expect(document.activeElement?.textContent).toBe("Verwijderen");
    await user.keyboard("{Home}d");
    expect(document.activeElement?.textContent).toBe("Dupliceren");
    await user.keyboard(" ");
    expect(select).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("opens at the last item with ArrowUp; closes with Escape, Tab and outside click", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(open: boolean) => void>();
    const { container } = render(
      <ContextMenu
        triggerLabel="Meer acties"
        onOpenChange={change}
        items={[{ id: "one", label: "Actie", onSelect: vi.fn<() => void>() }]}
      />,
    );
    const trigger = screen.getByRole("button");
    trigger.focus();
    await user.keyboard("{ArrowUp}");
    expect(await axeViolations(container)).toEqual([]);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
    await user.click(trigger);
    await user.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(trigger);
    await user.click(document.body);
    expect(document.activeElement).toBe(trigger);
    expect(change).toHaveBeenLastCalledWith(false);
  });
});
