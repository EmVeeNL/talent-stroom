import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SearchInput } from "./SearchInput.tsx";
import { axeViolations } from "../test-utils.ts";

describe("SearchInput", () => {
  it("debounces typing and clears with a named button", async () => {
    vi.useFakeTimers();
    const search = vi.fn<(value: string) => void>();
    const { container } = render(
      <SearchInput label="Zoeken" clearLabel="Wissen" onSearch={search} debounceMs={200} searchLandmark />,
    );
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Sam" } });
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(search).toHaveBeenLastCalledWith("Sam");
    fireEvent.click(screen.getByRole("button", { name: "Wissen" }));
    await vi.advanceTimersByTimeAsync(200);
    expect(search).toHaveBeenLastCalledWith("");
    vi.useRealTimers();
    expect(screen.getByRole("search")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
  it("cancels pending searches when unmounted", async () => {
    vi.useFakeTimers();
    const search = vi.fn<(value: string) => void>();
    const { unmount } = render(<SearchInput label="Zoeken" clearLabel="Wissen" onSearch={search} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Sam" } });
    unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(search).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
