import { useState } from "react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  FileUploader,
  NumberInput,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
  TextField,
} from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
export function Forms() {
  const { tr } = useGallery();
  const [hybrid, setHybrid] = useState(true);
  const [priority, setPriority] = useState(2);
  const [contract, setContract] = useState("permanent");
  return (
    <>
      <Section title={tr("gallery.buttons")}>
        <Button>{tr("gallery.buttons.primary")}</Button>
        <Button variant="secondary">{tr("gallery.buttons.secondary")}</Button>
        <Button variant="ghost">{tr("gallery.buttons.ghost")}</Button>
        <Button variant="danger" icon="delete">
          {tr("gallery.buttons.danger")}
        </Button>
        <Button disabled>{tr("gallery.buttons.disabled")}</Button>
        <Button loading loadingLabel={tr("gallery.buttons.loadingLabel")}>
          {tr("gallery.buttons.loading")}
        </Button>
        <Button icon="add">{tr("gallery.buttons.withIcon")}</Button>
        <Button size="sm">{tr("gallery.buttons.small")}</Button>
        <Button size="lg" iconPosition="end" icon="arrow_forward">
          {tr("gallery.buttons.large")}
        </Button>
      </Section>
      <Section title={tr("gallery.forms.newVacancy")}>
        <div className="gallery-vacancy-form">
          <TextField
            label={tr("gallery.forms.role")}
            hint={tr("gallery.forms.roleHint")}
            required
            defaultValue="Senior recruiter"
          />
          <Select
            label={tr("gallery.forms.client")}
            hint={tr("gallery.forms.clientHint")}
            placeholder={tr("gallery.forms.clientPlaceholder")}
            required
            defaultValue="voorbeeld"
          >
            <option value="voorbeeld">Voorbeeld &amp; Partners · Utrecht</option>
            <option value="noord">Noord Recruitment · Amsterdam</option>
          </Select>
          <Textarea
            label={tr("gallery.forms.summary")}
            hint={tr("gallery.forms.summaryHint")}
            maxLength={500}
            autoGrow
            defaultValue="Je bouwt duurzame teams en begeleidt kandidaten naar hun volgende stap."
          />
          <NumberInput
            label={tr("gallery.forms.salary")}
            hint={tr("gallery.forms.salaryHint")}
            min={2500}
            max={10000}
            step={250}
            defaultValue={4500}
            decrementLabel={tr("gallery.forms.decrease")}
            incrementLabel={tr("gallery.forms.increase")}
          />
          <TextField
            type="date"
            label={tr("gallery.forms.closing")}
            hint={tr("gallery.forms.dateHint")}
            defaultValue="2026-12-01"
          />
          <RadioGroup
            label={tr("gallery.forms.contract")}
            value={contract}
            onChange={setContract}
            card
            options={[
              {
                value: "permanent",
                label: tr("gallery.forms.permanent"),
                description: tr("gallery.forms.contractDescription"),
              },
              {
                value: "temporary",
                label: tr("gallery.forms.temporary"),
                description: tr("gallery.forms.temporaryDescription"),
              },
            ]}
          />
          <Switch
            label={tr("gallery.forms.hybrid")}
            description={tr("gallery.forms.hybridDescription")}
            checked={hybrid}
            onChange={setHybrid}
          />
          <CheckboxGroup legend={tr("gallery.forms.benefits")} hint={tr("gallery.forms.benefitHint")}>
            <Checkbox label={tr("gallery.forms.pension")} defaultChecked />
            <Checkbox label={tr("gallery.forms.travel")} description={tr("gallery.forms.travel")} />
          </CheckboxGroup>
          <Slider
            label={tr("gallery.forms.placement")}
            min={1}
            max={3}
            value={priority}
            onChange={setPriority}
            minLabel={tr("gallery.forms.low")}
            maxLabel={tr("gallery.forms.high")}
            formatValue={(n) =>
              n === 3 ? tr("gallery.forms.high") : n === 1 ? tr("gallery.forms.low") : "Normaal · 2"
            }
          />
          <FileUploader
            label={tr("gallery.forms.upload")}
            hint={tr("gallery.forms.uploadHint")}
            accept=".pdf,.docx"
            maxSize={10 * 1024 * 1024}
            chooseLabel={tr("gallery.forms.chooseFile")}
            removeLabel={(name) => tr("gallery.forms.removeFile").replace("{name}", name)}
            wrongTypeMessage={(name) => tr("gallery.forms.wrongType").replace("{name}", name)}
            tooLargeMessage={(name, size) =>
              tr("gallery.forms.tooLarge").replace("{name}", name).replace("{size}", String(size))
            }
          />
          <Button type="submit">{tr("gallery.forms.submit")}</Button>
        </div>
      </Section>
      <Section title={tr("gallery.fields")}>
        <TextField label={tr("gallery.fields.name")} hint={tr("gallery.fields.nameHint")} />
        <TextField
          label={tr("gallery.fields.email")}
          type="email"
          defaultValue="x@"
          error={tr("gallery.fields.emailError")}
        />
        <TextField label={tr("gallery.fields.required")} required />
        <TextField label={tr("gallery.forms.disabled")} disabled />
        <Textarea label={tr("gallery.forms.summary")} error={tr("gallery.forms.summaryError")} required />
        <Select
          label={tr("gallery.forms.client")}
          placeholder={tr("gallery.forms.clientPlaceholder")}
          error={tr("gallery.forms.clientError")}
          required
        >
          <option value="">{tr("gallery.forms.clientPlaceholder")}</option>
        </Select>
        <NumberInput
          label={tr("gallery.forms.salary")}
          defaultValue={4500}
          decrementLabel={tr("gallery.forms.decrease")}
          incrementLabel={tr("gallery.forms.increase")}
          disabled
        />
        <Checkbox indeterminate label={tr("gallery.forms.requiredState")} />
        <p role="note">
          {tr("gallery.forms.disabledState")} · {tr("gallery.forms.errorState")}
        </p>
      </Section>
    </>
  );
}
