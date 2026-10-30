import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Link } from "./Link.tsx";

it("navigates internal links with history while retaining modified-click behavior", () => {
  window.history.replaceState(null, "", "/");
  const listener = vi.fn<() => void>();
  window.addEventListener("popstate", listener);
  render(<Link to="/apps/chat">Chat</Link>);
  fireEvent.click(screen.getByRole("link"));
  expect(window.location.pathname).toBe("/apps/chat");
  expect(listener).toHaveBeenCalledOnce();
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
  screen.getByRole("link").dispatchEvent(event);
  expect(window.location.pathname).toBe("/apps/chat");
  window.removeEventListener("popstate", listener);
});
