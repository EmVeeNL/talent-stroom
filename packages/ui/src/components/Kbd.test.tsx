import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Kbd } from "./Kbd.tsx";
it("renders a semantic keyboard chip", async () => {
  const { container } = render(<Kbd>Ctrl K</Kbd>);
  expect(container.querySelector("kbd")?.textContent).toBe("Ctrl K");
  expect(await axeViolations(container)).toEqual([]);
});
