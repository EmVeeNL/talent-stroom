import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formEventClient } from "@tanstack/react-form";
import { z } from "zod";
import { useAppForm, FormSummary, submitForm } from "./forms.tsx";
import type { Locale } from "@talentstroom/i18n";

function Sample({ locale = "nl-NL", save }: { locale?: Locale; save: (value: { name: string }) => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { name: "" },
    validators: {
      onBlur: z.object({ name: z.string().trim().min(2) }),
      onSubmit: z.object({ name: z.string().trim().min(2) }),
    },
    onSubmit: async ({ value }) => save(z.object({ name: z.string().trim().min(2) }).parse(value)),
  });
  return (
    <form.AppForm>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submitForm(form);
        }}
      >
        <FormSummary locale={locale} fields={{ name: { id: "sample-name", label: "Name" } }} />
        <form.AppField name="name">
          {(field) => <field.Text id="sample-name" label="Name" locale={locale} />}
        </form.AppField>
        <button type="submit">Save</button>
      </form>
    </form.AppForm>
  );
}

describe("validated forms", () => {
  it("never constructs or queues devtools payloads while editing or submitting", async () => {
    const payload = vi.spyOn(formEventClient, "createEventPayload");
    const save = vi.fn<(value: { name: string }) => Promise<void>>().mockResolvedValue();
    render(<Sample save={save} />);
    await userEvent.type(screen.getByLabelText("Name"), "Synthetic agency");
    await userEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(payload).not.toHaveBeenCalled();
    payload.mockRestore();
  });
  it.each([
    ["nl-NL", "Vul dit veld correct in."],
    ["en-GB", "Enter a valid value."],
  ] as const)("focuses the summary and links localized errors (%s)", async (locale, message) => {
    const save = vi.fn<(value: { name: string }) => Promise<void>>();
    render(<Sample locale={locale} save={save} />);
    fireEvent.click(screen.getByText("Save"));
    const summary = await screen.findByRole("region");
    await waitFor(() => expect(document.activeElement).toBe(summary));
    const input = screen.getByLabelText("Name");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toContain("sample-name-error");
    await userEvent.click(screen.getByRole("link", { name: `Name: ${message}` }));
    expect(document.activeElement).toBe(input);
    expect(save).not.toHaveBeenCalled();
  });
  it("validates on blur, parses transformed values, and blocks duplicate pending submissions", async () => {
    let finish: (() => void) | undefined;
    const save = vi.fn<(value: { name: string }) => Promise<void>>(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<Sample save={save} />);
    const input = screen.getByLabelText("Name");
    await userEvent.type(input, "x");
    await userEvent.tab();
    expect(await screen.findByText("Vul dit veld correct in.")).toBeTruthy();
    await userEvent.clear(input);
    await userEvent.type(input, "  Testbureau  ");
    await userEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ name: "Testbureau" }));
    fireEvent.click(screen.getByText("Save"));
    expect(save).toHaveBeenCalledTimes(1);
    finish?.();
  });
});
