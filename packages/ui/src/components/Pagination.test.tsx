import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "./Pagination.tsx";
import { axeViolations } from "../test-utils.ts";

describe("Pagination", () => {
  it("announces current page, supports buttons and page size", async () => {
    const user = userEvent.setup();
    const page = vi.fn<(value: number) => void>(),
      size = vi.fn<(value: number) => void>();
    const { container } = render(
      <Pagination
        label="Pagina’s"
        page={2}
        total={45}
        pageSize={10}
        onPageChange={page}
        onPageSizeChange={size}
        previousLabel="Vorige"
        nextLabel="Volgende"
        pageLabel={(n) => `Pagina ${n}`}
        pageSizeLabel="Per pagina"
      />,
    );
    expect(screen.getByRole("button", { name: "Pagina 2" }).getAttribute("aria-current")).toBe("page");
    await user.click(screen.getByRole("button", { name: "Volgende" }));
    expect(page).toHaveBeenCalledWith(3);
    await user.selectOptions(screen.getByRole("combobox"), "25");
    expect(size).toHaveBeenCalledWith(25);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("handles an empty result and a very large page count with bounded controls", async () => {
    const props = {
      label: "Pagina’s",
      page: 1,
      total: 0,
      pageSize: 10,
      onPageChange: () => {},
      onPageSizeChange: () => {},
      previousLabel: "Vorige",
      nextLabel: "Volgende",
      pageLabel: (n: number) => `Pagina ${n}`,
      pageSizeLabel: "Per pagina",
    };
    const { container, rerender } = render(<Pagination {...props} />);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Vorige" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Volgende" }).disabled).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Pagination {...props} total={1000000} page={50000} />);
    expect(screen.getAllByRole("button").length).toBeLessThanOrEqual(9);
    expect(screen.getByRole("button", { name: "Pagina 50000" }).getAttribute("aria-current")).toBe("page");
    expect(await axeViolations(container)).toEqual([]);
  });
});
