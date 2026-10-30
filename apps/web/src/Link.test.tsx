import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { Link } from "./Link.tsx";

it("navigates internal links with history while retaining native link behavior", async () => {
  window.history.replaceState(null, "", "/");
  const root = createRootRoute({
    component: () => (
      <>
        <Link to="/apps/chat" hash="messages">
          Chat
        </Link>
        <Link to="/apps/chat" target="_blank">
          New tab
        </Link>
        <Link to="/apps/chat" download="">
          Download
        </Link>
        <a href="https://example.test">External</a>
      </>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([createRoute({ getParentRoute: () => root, path: "/apps/chat" })]),
  });
  render(<RouterProvider router={router} />);
  const chat = await screen.findByRole("link", { name: "Chat" });
  for (const modifier of ["ctrlKey", "metaKey", "altKey", "shiftKey"]) {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, [modifier]: true });
    chat.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(window.location.pathname).toBe("/");
  }
  for (const name of ["New tab", "Download", "External"]) {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    let preventedByLink = true;
    document.addEventListener(
      "click",
      (click) => {
        preventedByLink = click.defaultPrevented;
        click.preventDefault();
      },
      { once: true },
    );
    screen.getByRole("link", { name }).dispatchEvent(event);
    expect(preventedByLink).toBe(false);
  }
  fireEvent.click(chat);
  await waitFor(() => expect(window.location.pathname + window.location.hash).toBe("/apps/chat#messages"));
  window.history.back();
  await waitFor(() => expect(window.location.pathname).toBe("/"));
});
