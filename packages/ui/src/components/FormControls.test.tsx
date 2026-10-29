import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DateRangePicker } from "./DateRangePicker.tsx";
import { Combobox } from "./Combobox.tsx";
import { Select } from "./Select.tsx";
import { Checkbox } from "./Checkbox.tsx";
import { Switch } from "./Switch.tsx";
import { RadioGroup } from "./RadioGroup.tsx";
import { axeViolations } from "../test-utils.ts";
import { Button } from "./Button.tsx";
import { TextField } from "./TextField.tsx";
import { Textarea } from "./Textarea.tsx";
import { NumberInput } from "./NumberInput.tsx";
import { Slider } from "./Slider.tsx";
import { FileUploader } from "./FileUploader.tsx";

describe("design kit form controls", () => {
  it("supports both icon slots and square icon-only actions", () => {
    const { container } = render(
      <>
        <Button variant="outline" leadingIcon="add" trailingIcon="arrow_forward">
          Opslaan
        </Button>
        <Button icon="add" aria-label="Toevoegen" />
      </>,
    );
    expect(container.querySelectorAll(".ts-icon")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Toevoegen" }).className).toContain("ts-button--icon-only");
  });
  it("reveals a password without changing its value or submitting", async () => {
    const submit = vi.fn<() => void>();
    render(
      <form onSubmit={submit}>
        <TextField
          type="password"
          label="Wachtwoord"
          defaultValue="synthetic"
          visibilityLabels={{ show: "Tonen", hide: "Verbergen" }}
        />
      </form>,
    );
    const input = screen.getByLabelText("Wachtwoord");
    await userEvent.click(screen.getByRole("button", { name: "Tonen" }));
    expect(input).toHaveProperty("type", "text");
    expect(input).toHaveProperty("value", "synthetic");
    await userEvent.click(screen.getByRole("button", { name: "Verbergen" }));
    expect(input).toHaveProperty("type", "password");
    expect(submit).not.toHaveBeenCalled();
  });
  it("renders a search affordance and shortcut slot", () => {
    const { container } = render(<TextField label="Zoeken" type="search" shortcut={<kbd>⌘K</kbd>} />);
    expect(container.querySelector(".ts-icon")?.textContent).toBe("search");
    expect(screen.getByText("⌘K")).toBeTruthy();
  });
  it("updates the counter when a controlled value changes externally", () => {
    const { rerender } = render(<Textarea label="Notitie" value="a" maxLength={50} readOnly />);
    rerender(<Textarea label="Notitie" value="abcd" maxLength={50} readOnly />);
    expect(screen.getByText("4 / 50")).toBeTruthy();
  });
  it("prevents readonly number changes from buttons and arrows", async () => {
    const change = vi.fn<() => void>();
    render(
      <NumberInput
        label="Aantal"
        defaultValue={5}
        onChange={change}
        readOnly
        decrementLabel="Minder"
        incrementLabel="Meer"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Meer" }));
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(change).not.toHaveBeenCalled();
  });
  it("connects slider hints and errors to the native keyboard control", () => {
    render(
      <Slider
        label="Ervaring"
        min={0}
        max={100}
        value={75}
        onChange={() => {}}
        hint="In jaren"
        error="Controleer de waarde"
      />,
    );
    const ids = screen.getByRole("slider").getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(["In jaren", "Controleer de waarde"]);
  });
  it("rejects drops while disabled", () => {
    const change = vi.fn<() => void>();
    const { container } = render(
      <FileUploader
        label="CV"
        disabled
        onFilesChange={change}
        chooseLabel="Kiezen"
        dropLabel="Sleep bestanden hierheen"
        removeLabel={(n) => n}
        wrongTypeMessage={(n) => n}
        tooLargeMessage={(n) => n}
      />,
    );
    const dropzone = container.querySelector(".ts-upload");
    if (!dropzone) throw new Error("Missing dropzone");
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [new File(["x"], "sample.pdf", { type: "application/pdf" })] },
    });
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByLabelText("CV")).toHaveProperty("disabled", true);
  });
});

// Native and composite selection controls keep their keyboard and readonly contracts.

it("keeps readonly multiselect chips and selection unchanged", async () => {
  const change = vi.fn<() => void>();
  render(
    <Combobox
      label="Vaardigheden"
      options={[{ value: "react", label: "React" }]}
      multiple
      value={["react"]}
      onChange={change}
      readOnly
      error="Controleer de selectie"
      emptyLabel="Geen opties"
      removeLabel={(n) => `Verwijder ${n}`}
    />,
  );
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await userEvent.click(screen.getByRole("button", { name: "Verwijder React" }));
  expect(change).not.toHaveBeenCalled();
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(screen.getByRole("combobox").getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
});
it("preserves accessible readonly selection semantics", async () => {
  const change = vi.fn<() => void>();
  const { container } = render(
    <>
      <Checkbox label="Selectie" readOnly defaultChecked onChange={change} />
      <Switch label="Meldingen" readOnly checked onChange={change} />
      <RadioGroup
        label="Contract"
        readOnly
        value="one"
        onChange={change}
        options={[
          { value: "one", label: "Vast" },
          { value: "two", label: "Tijdelijk" },
        ]}
      />
      <Select label="Klant" readOnly defaultValue="one">
        <option value="one">Voorbeeld</option>
      </Select>
    </>,
  );
  await userEvent.click(screen.getByRole("checkbox"));
  await userEvent.click(screen.getByRole("switch"));
  await userEvent.click(screen.getByRole("radio", { name: "Tijdelijk" }));
  expect(change).not.toHaveBeenCalled();
  expect(await axeViolations(container)).toEqual([]);
});

it("keeps the native date input under a decorative Rounded calendar icon", () => {
  const { container } = render(<TextField label="Datum" type="date" defaultValue="2026-12-01" />);
  expect(screen.getByLabelText("Datum")).toHaveProperty("type", "date");
  expect(container.querySelector(".ts-field__calendar [aria-hidden='true']")?.textContent).toBe("calendar_month");
});
it("keeps readonly date ranges closed and sliders unchanged on keyboard input", async () => {
  const change = vi.fn<() => void>();
  const { container } = render(
    <>
      <DateRangePicker
        label="Periode"
        readOnly
        onChange={change}
        error="Controleer de periode"
        labels={{
          previous: "Vorige",
          next: "Volgende",
          today: "Vandaag",
          last7: "Laatste week",
          month: "Maand",
          hint: "Kies datums",
          start: "Start",
          complete: "Gekozen",
        }}
      />
      <Slider label="Ervaring" readOnly min={0} max={100} value={75} onChange={change} />
    </>,
  );
  const button = screen.getByRole("button", { name: /Periode/ });
  expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(button.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  await userEvent.click(button);
  expect(screen.queryByRole("dialog")).toBeNull();
  const slider = screen.getByRole("slider");
  slider.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(change).not.toHaveBeenCalled();
  expect(await axeViolations(container)).toEqual([]);
});
