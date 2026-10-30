import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout.tsx";

describe("AuthLayout", () => {
  it("places the auth content and controls over a full-page hero background", () => {
    render(
      <AuthLayout hero={<span>City photo</span>} controls={<button>Language</button>}>
        <main>Sign in</main>
      </AuthLayout>,
    );

    expect(screen.getByText("City photo").closest(".auth-brand")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Language" }).closest(".auth-controls")).toBeTruthy();
    expect(screen.getByText("Sign in").closest(".auth-panel")).toBeTruthy();
  });
});
