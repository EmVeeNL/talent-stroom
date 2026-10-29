import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Button } from "./Button.tsx";

describe("Button", () => {
  it("defaults to type=button and calls onClick", async () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Opslaan</Button>);
    const button = screen.getByRole("button", { name: "Opslaan" });
    expect(button).toHaveProperty("type", "button");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled and is not focusable", async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button disabled onClick={onClick}>
        Opslaan
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Opslaan" });
    await userEvent.click(button);
    await userEvent.tab();
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveProperty("disabled", true);
    expect(document.activeElement).not.toBe(button);
  });

  it("loading: announces busy state, ignores clicks and keeps focus", async () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button loading loadingLabel="Bezig met opslaan" onClick={onClick}>
        Opslaan
      </Button>,
    );
    const button = screen.getByRole("button", { name: /Opslaan/ });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.textContent).toContain("Bezig met opslaan");
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.click(button);
    await userEvent.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a decorative icon and supports variants and sizes", () => {
    render(
      <Button variant="danger" size="lg" icon="delete">
        Verwijderen
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Verwijderen" });
    expect(button.className).toContain("ts-button--danger");
    expect(button.className).toContain("ts-button--lg");
    expect(button.querySelector("[aria-hidden='true']")?.textContent).toBe("delete");
  });

  it("has no axe violations in every variant and state", async () => {
    const { container } = render(
      <div>
        <Button variant="primary">A</Button>
        <Button variant="secondary" icon="add">
          B
        </Button>
        <Button variant="ghost">C</Button>
        <Button variant="danger">D</Button>
        <Button disabled>E</Button>
        <Button loading loadingLabel="Laden">
          F
        </Button>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

function iconOnlyTypeContract() {
  // @ts-expect-error Icon-only actions must have aria-label.
  return <Button icon="add" />;
}
void iconOnlyTypeContract;
