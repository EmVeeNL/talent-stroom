import { useState } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Checkbox,
  Combobox,
  DateRangePicker,
  FileUploader,
  NumberInput,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
  TextField,
} from "@talentstroom/ui";
import type { ButtonVariant, DateRange } from "@talentstroom/ui";
import { useGallery } from "../context.ts";

const states = ["default", "hover", "focus", "filled", "error", "disabled", "readonly"] as const;
type State = (typeof states)[number];
const variants: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger", "success", "warning"];
const buttonStates = ["default", "hover", "active", "focus", "disabled", "loading"] as const;

const fieldValue = (s: State, value = "Voorbeeld") => (s === "filled" || s === "readonly" ? value : undefined);

function Board({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="gallery-form-board">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function StateBoard({ title, children }: { title: string; children: (state: State) => ReactNode }) {
  const { tr } = useGallery();
  return (
    <Board title={title}>
      <div className="gallery-form-states">
        {states.map((state) => (
          <div key={state} data-state={state} className="gallery-form-example">
            <h3>{tr(`gallery.forms.kit.${state}`)}</h3>
            {children(state)}
          </div>
        ))}
      </div>
    </Board>
  );
}
export function Forms() {
  const { tr } = useGallery();
  const error = tr("gallery.forms.kit.required");
  const shared = (s: State) => ({
    disabled: s === "disabled",
    readOnly: s === "readonly",
    ...(s === "error" ? { error } : {}),
  });
  return (
    <div className="gallery-forms">
      <Board title={tr("gallery.forms.kit.buttons")}>
        {variants.map((variant) => (
          <div key={variant} className="gallery-button-row">
            <h3>{tr(`gallery.forms.kit.${variant}`)}</h3>
            <div className="gallery-button-states">
              {buttonStates.map((state) => (
                <div key={state} className="gallery-form-example">
                  <span>{tr(`gallery.forms.kit.${state}`)}</span>
                  <Button
                    variant={variant}
                    data-state={state}
                    disabled={state === "disabled"}
                    loading={state === "loading"}
                    loadingLabel={tr("gallery.buttons.loadingLabel")}
                  >
                    {tr("gallery.forms.kit.save")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <h3>{tr("gallery.forms.kit.sizes")}</h3>
        <div className="gallery-form-actions">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Button key={size} size={size} leadingIcon="add" trailingIcon="arrow_forward">
              {tr(`gallery.buttons.${size === "sm" ? "small" : size === "lg" ? "large" : "withIcon"}`)}
            </Button>
          ))}
          {(["sm", "md", "lg"] as const).map((size) => (
            <Button key={size} size={size} icon="add" aria-label={tr("gallery.buttons.withIcon")} />
          ))}
        </div>
      </Board>
      <StateBoard title={tr("gallery.fields.name")}>
        {(s) => (
          <TextField
            label={tr("gallery.fields.name")}
            placeholder={tr("gallery.forms.kit.placeholder")}
            defaultValue={fieldValue(s)}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.fields.email")}>
        {(s) => (
          <TextField
            type="email"
            label={tr("gallery.fields.email")}
            placeholder={tr("gallery.forms.kit.emailPlaceholder")}
            defaultValue={fieldValue(s, "voorbeeld@organisatie.test")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.password")}>
        {(s) => (
          <TextField
            type="password"
            label={tr("gallery.forms.kit.password")}
            visibilityLabels={{ show: tr("gallery.forms.kit.show"), hide: tr("gallery.forms.kit.hide") }}
            defaultValue={fieldValue(s, "synthetic-demo")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.search")}>
        {(s) => (
          <TextField
            type="search"
            label={tr("gallery.forms.kit.search")}
            placeholder={tr("gallery.filters.searchHint")}
            shortcut={<kbd>⌘K</kbd>}
            defaultValue={fieldValue(s)}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.url")}>
        {(s) => (
          <TextField
            type="url"
            label={tr("gallery.forms.kit.url")}
            placeholder="https://"
            defaultValue={fieldValue(s, "https://example.test")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.number")}>
        {(s) => (
          <TextField
            type="number"
            label={tr("gallery.forms.kit.number")}
            placeholder="0"
            defaultValue={fieldValue(s, "42")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.textarea")}>
        {(s) => (
          <Textarea
            label={tr("gallery.forms.kit.textarea")}
            placeholder={tr("gallery.forms.kit.placeholder")}
            maxLength={500}
            defaultValue={fieldValue(s)}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.select")}>
        {(s) => (
          <Select
            label={tr("gallery.forms.client")}
            placeholder={tr("gallery.forms.clientPlaceholder")}
            defaultValue={fieldValue(s, "one") ?? ""}
            {...shared(s)}
          >
            <option value="one">{tr("gallery.filters.client1")}</option>
            <option value="two">{tr("gallery.filters.client2")}</option>
          </Select>
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.multi")}>{(s) => <MultiExample state={s} />}</StateBoard>
      <StateBoard title={tr("gallery.forms.salary")}>
        {(s) => (
          <NumberInput
            label={tr("gallery.forms.salary")}
            defaultValue={s === "filled" || s === "readonly" ? 4500 : 0}
            min={0}
            max={10000}
            step={250}
            decrementLabel={tr("gallery.forms.decrease")}
            incrementLabel={tr("gallery.forms.increase")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.date")}>
        {(s) => (
          <TextField
            type="date"
            label={tr("gallery.forms.kit.date")}
            defaultValue={fieldValue(s, "2026-12-01")}
            {...shared(s)}
          />
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.filters.range")}>{(s) => <RangeExample state={s} />}</StateBoard>
      <StateBoard title={tr("gallery.forms.kit.checkbox")}>
        {(s) => (
          <>
            <Checkbox
              label={tr("gallery.forms.pension")}
              defaultChecked={s === "filled" || s === "readonly"}
              disabled={s === "disabled"}
              readOnly={s === "readonly"}
              aria-invalid={s === "error" || undefined}
              {...(s === "error" ? { description: error } : {})}
            />
            <Checkbox
              label={tr("gallery.forms.requiredState")}
              indeterminate
              disabled={s === "disabled"}
              readOnly={s === "readonly"}
            />
          </>
        )}
      </StateBoard>
      <StateBoard title={tr("gallery.forms.kit.radio")}>{(s) => <RadioExample state={s} />}</StateBoard>
      <StateBoard title={tr("gallery.forms.kit.switch")}>{(s) => <SwitchExample state={s} />}</StateBoard>
      <StateBoard title={tr("gallery.forms.kit.slider")}>{(s) => <SliderExample state={s} />}</StateBoard>
      <StateBoard title={tr("gallery.forms.upload")}>{(state) => <FileExample state={state} />}</StateBoard>
    </div>
  );
}
function MultiExample({ state }: { state: State }) {
  const { tr } = useGallery();
  const [value, setValue] = useState<string[]>(state === "filled" || state === "readonly" ? ["react", "ts"] : []);
  return (
    <Combobox
      label={tr("gallery.forms.kit.multi")}
      options={[
        { value: "react", label: "React" },
        { value: "ts", label: "TypeScript" },
        { value: "js", label: "JavaScript" },
      ]}
      multiple
      value={value}
      onChange={setValue}
      disabled={state === "disabled"}
      readOnly={state === "readonly"}
      {...(state === "error" ? { error: tr("gallery.forms.kit.required") } : {})}
      emptyLabel={tr("gallery.filters.noOptions")}
      removeLabel={(name) => tr("gallery.filters.remove").replace("{name}", name)}
    />
  );
}
function RadioExample({ state }: { state: State }) {
  const { tr } = useGallery();
  const [value, setValue] = useState(state === "filled" || state === "readonly" ? "permanent" : "");
  return (
    <RadioGroup
      label={tr("gallery.forms.contract")}
      value={value}
      onChange={setValue}
      disabled={state === "disabled"}
      readOnly={state === "readonly"}
      {...(state === "error" ? { error: tr("gallery.forms.kit.required") } : {})}
      options={[
        { value: "permanent", label: tr("gallery.forms.permanent") },
        { value: "temporary", label: tr("gallery.forms.temporary") },
      ]}
    />
  );
}
function SwitchExample({ state }: { state: State }) {
  const { tr } = useGallery();
  const [value, setValue] = useState(state === "filled" || state === "readonly");
  return (
    <Switch
      label={tr("gallery.forms.hybrid")}
      checked={value}
      onChange={setValue}
      readOnly={state === "readonly"}
      disabled={state === "disabled"}
      aria-invalid={state === "error" || undefined}
      {...(state === "error" ? { description: tr("gallery.forms.kit.required") } : {})}
    />
  );
}
function SliderExample({ state }: { state: State }) {
  const { tr } = useGallery();
  const [value, setValue] = useState(state === "filled" || state === "readonly" ? 75 : 25);
  return (
    <Slider
      label={tr("gallery.forms.kit.slider")}
      min={0}
      max={100}
      value={value}
      onChange={setValue}
      disabled={state === "disabled"}
      readOnly={state === "readonly"}
      {...(state === "error" ? { error: tr("gallery.forms.kit.required") } : {})}
    />
  );
}
function RangeExample({ state }: { state: State }) {
  const { tr, locale } = useGallery();
  const [value, setValue] = useState<DateRange | undefined>(
    state === "filled" || state === "readonly"
      ? { start: new Date(2026, 10, 1), end: new Date(2026, 10, 14) }
      : undefined,
  );
  return (
    <DateRangePicker
      label={tr("gallery.filters.range")}
      {...(value ? { value } : {})}
      onChange={setValue}
      locale={locale}
      today={new Date(2026, 9, 29)}
      disabled={state === "disabled"}
      readOnly={state === "readonly"}
      {...(state === "error" ? { error: tr("gallery.forms.kit.required") } : {})}
      labels={{
        previous: tr("gallery.filters.previousMonth"),
        next: tr("gallery.filters.nextMonth"),
        today: tr("gallery.filters.today"),
        last7: tr("gallery.filters.last7"),
        month: tr("gallery.filters.month"),
        hint: tr("gallery.forms.dateHint"),
        start: tr("gallery.filters.dateStart"),
        complete: tr("gallery.filters.dateComplete"),
      }}
    />
  );
}

function FileExample({ state }: { state: State }) {
  const { tr } = useGallery();
  const [files, setFiles] = useState<File[]>(() =>
    state === "filled" || state === "readonly"
      ? [new File(["synthetic"], "voorbeeld.pdf", { type: "application/pdf" })]
      : [],
  );
  return (
    <FileUploader
      label={tr("gallery.forms.upload")}
      dropLabel={tr("gallery.forms.kit.drop")}
      chooseLabel={tr("gallery.forms.kit.choose")}
      acceptedTypesLabel={tr("gallery.forms.kit.types")}
      accept=".pdf,.doc,.docx,.jpg,.png"
      disabled={state === "disabled"}
      readOnly={state === "readonly"}
      {...(state === "error" ? { error: tr("gallery.forms.kit.required") } : {})}
      files={files}
      onFilesChange={setFiles}
      removeLabel={(name) => tr("gallery.forms.removeFile").replace("{name}", name)}
      wrongTypeMessage={(name) => tr("gallery.forms.wrongType").replace("{name}", name)}
      tooLargeMessage={(name, size) =>
        tr("gallery.forms.tooLarge").replace("{name}", name).replace("{size}", String(size))
      }
    />
  );
}
