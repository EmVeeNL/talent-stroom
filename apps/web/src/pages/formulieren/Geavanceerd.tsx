import { useState } from "react";
import { Combobox, DateRangePicker, FileUploader, Slider } from "@talentstroom/ui";
import type { DateRange } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

export default function GeavanceerdPage({ locale }: { locale: Locale }) {
  const [client, setClient] = useState<string[]>([]),
    [skills, setSkills] = useState(["react", "typescript"]),
    [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 30) }),
    [salary, setSalary] = useState(75),
    [files, setFiles] = useState<File[]>([]);
  const options = [
    { value: "noorderlicht", label: "Noorderlicht Studio" },
    { value: "kompas", label: "Kompas Werkt" },
    { value: "rivier", label: "Rivier & Co" },
  ];
  const skillsOptions = [
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" },
    { value: "design", label: "Product design" },
  ];
  const commonDateLabels = {
    previous: t(locale, "gallery.filters.previousMonth"),
    next: t(locale, "gallery.filters.nextMonth"),
    today: t(locale, "gallery.filters.today"),
    last7: t(locale, "gallery.filters.last7"),
    month: t(locale, "gallery.filters.month"),
    hint: t(locale, "demo.forms.date"),
    start: t(locale, "demo.forms.start"),
    complete: t(locale, "demo.forms.end"),
  };
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.geavanceerd">
      <FormSection title={t(locale, "demo.forms.section.advanced")}>
        <Combobox
          label={t(locale, "demo.forms.client")}
          placeholder={t(locale, "demo.forms.chooseClient")}
          options={options}
          value={client}
          onChange={setClient}
          emptyLabel={t(locale, "gallery.filters.noOptions")}
          removeLabel={(name) => t(locale, "gallery.filters.remove").replace("{name}", name)}
        />
        <Combobox
          label={t(locale, "demo.forms.benefits")}
          options={skillsOptions}
          value={skills}
          onChange={setSkills}
          multiple
          emptyLabel={t(locale, "gallery.filters.noOptions")}
          removeLabel={(name) => t(locale, "gallery.filters.remove").replace("{name}", name)}
        />
        <DateRangePicker
          label={t(locale, "demo.forms.date")}
          value={range}
          onChange={setRange}
          locale={locale}
          today={new Date(2026, 9, 30)}
          labels={commonDateLabels}
        />
        <DateRangePicker
          label={t(locale, "demo.forms.start")}
          selectionMode="single"
          onChange={setRange}
          locale={locale}
          today={new Date(2026, 9, 30)}
          labels={commonDateLabels}
        />
        <Slider
          className="demo-form-full"
          label={t(locale, "demo.forms.priority")}
          min={0}
          max={100}
          value={salary}
          onChange={setSalary}
          minLabel={t(locale, "demo.forms.low")}
          maxLabel={t(locale, "demo.forms.high")}
          formatValue={(value) => `${value}%`}
        />
        <div className="demo-form-full">
          <FileUploader
            label={t(locale, "demo.forms.upload")}
            dropLabel={t(locale, "gallery.forms.kit.drop")}
            chooseLabel={t(locale, "gallery.forms.kit.choose")}
            acceptedTypesLabel={t(locale, "demo.forms.acceptedTypes")}
            accept=".pdf,.docx"
            files={files}
            onFilesChange={setFiles}
            removeLabel={(name) => t(locale, "gallery.forms.removeFile").replace("{name}", name)}
            wrongTypeMessage={(name) => t(locale, "gallery.forms.wrongType").replace("{name}", name)}
            tooLargeMessage={(name, size) =>
              t(locale, "gallery.forms.tooLarge").replace("{name}", name).replace("{size}", String(size))
            }
          />
        </div>
      </FormSection>
    </FormPage>
  );
}
