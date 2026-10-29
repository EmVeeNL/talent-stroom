import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Skeleton } from "./Skeleton.tsx";
it.each(["text", "avatar", "card", "rows"] as const)(
  "hides %s placeholders from assistive technology",
  async (shape) => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton shape={shape} />
      </div>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  },
);
