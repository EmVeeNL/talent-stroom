import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Header } from "./Header.tsx";
it("exposes banner and slots", async () => {
  const { container } = render(
    <Header
      search={<button>Zoeken</button>}
      notifications={<button>Meldingen</button>}
      userMenu={<button>Profiel</button>}
    />,
  );
  expect(screen.getByRole("banner")).toBeTruthy();
  expect(screen.getAllByRole("button")).toHaveLength(3);
  expect(await axeViolations(container)).toEqual([]);
});
