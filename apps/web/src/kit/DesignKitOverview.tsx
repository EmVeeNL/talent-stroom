import { useId, useState } from "react";
import type { ReactNode } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  FilterChip,
  Icon,
  RECRUITMENT_STAGE_IDS,
  RadioGroup,
  Select,
  Slider,
  StageBadge,
  Switch,
  TextField,
  Textarea,
  Toast,
  Tooltip,
} from "@talentstroom/ui";
import type { IconName } from "@talentstroom/ui";
import "./design-kit-overview.css";

type KitKey = Extract<MessageKey, `demo.kit.${string}`>;
type Tr = (key: KitKey, values?: Record<string, string | number>) => string;
const noop = () => undefined;

function Panel({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  return (
    <Card as="section" headingLevel={2} className={`dk-panel ${className}`} title={title}>
      {children}
    </Card>
  );
}

/** Static look-alike input with an optional trailing icon (kit shows these as plain fields). */
function IconField({
  label,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  placeholder: string;
  icon?: IconName;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="ts-field">
      <label className="ts-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="ts-field__control dk-icon-field">
        <input id={id} className="ts-field__input" type={type} placeholder={placeholder} />
        {icon && <Icon name={icon} size={20} />}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone,
  delta,
  values,
  locale,
}: {
  label: string;
  value: number;
  icon: IconName;
  tone: "info" | "success" | "violet";
  delta: number;
  values: number[];
  locale: Locale;
}) {
  const max = Math.max(...values),
    min = Math.min(...values),
    points = values
      .map((v, i) => `${(i / (values.length - 1)) * 76 + 2},${30 - ((v - min) / (max - min || 1)) * 26}`)
      .join(" ");
  return (
    <div className={`dk-kpi__card dk-kpi__card--${tone}`}>
      <div className="dk-kpi__head">
        <span className="dk-kpi__icon" aria-hidden="true">
          <Icon name={icon} size={24} />
        </span>
        <div>
          <span className="dk-kpi__label">{label}</span>
          <strong>{new Intl.NumberFormat(locale).format(value)}</strong>
        </div>
      </div>
      <div className="dk-kpi__foot">
        <div>
          <span className="dk-kpi__trend">
            <Icon name="arrow_upward" size={16} />+{delta}%
          </span>
          <small>{t(locale, "demo.elements.metrics.comparison")}</small>
        </div>
        <svg viewBox="0 0 80 32" aria-hidden="true">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

/** Inline month grid for October 2026 (fixed "today" 30 October), Monday first. */
function Calendar({ tr, locale }: { tr: Tr; locale: Locale }) {
  const [selected, setSelected] = useState(15);
  const offset = (new Date(2026, 9, 1, 12).getDay() + 6) % 7,
    weekday = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const cells = Array.from({ length: 42 }, (_, i) => new Date(2026, 9, 1 - offset + i, 12));
  return (
    <div className="dk-cal">
      <div className="dk-cal__head">
        <Button variant="ghost" size="sm" icon="chevron_left" aria-label={tr("demo.kit.prevMonth")} />
        <strong>{tr("demo.kit.monthTitle")}</strong>
        <Button variant="ghost" size="sm" icon="chevron_right" aria-label={tr("demo.kit.nextMonth")} />
      </div>
      <div className="dk-cal__grid">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="dk-cal__dow" aria-hidden="true">
            {weekday.format(new Date(2026, 9, 5 + i, 12))}
          </span>
        ))}
        {cells.map((d) => {
          const day = d.getDate(),
            inMonth = d.getMonth() === 9;
          return (
            <button
              key={d.toISOString()}
              type="button"
              className={inMonth ? undefined : "is-outside"}
              aria-pressed={inMonth && day === selected}
              aria-current={inMonth && day === 30 ? "date" : undefined}
              aria-label={new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(d)}
              onClick={() => inMonth && setSelected(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CANDIDATES = [
  { name: "Sophie Bakker", role: "Frontend Developer", city: "Amsterdam", stage: "gesprek", date: "15-01-2025" },
  { name: "Mark Jansen", role: "Backend Developer", city: "Utrecht", stage: "aanbod", date: "14-01-2025" },
  { name: "Lisa de Wit", role: "Product Designer", city: "Rotterdam", stage: "in_behandeling", date: "14-01-2025" },
  { name: "Thomas van Dijk", role: "DevOps Engineer", city: "Den Haag", stage: "nieuw", date: "13-01-2025" },
] as const;

const KANBAN = [
  {
    id: "nieuw",
    tone: "info",
    title: "Nieuw",
    count: 12,
    cards: [
      ["Frontend Developer", "TechCorp", "2d", "Sanne Willems"],
      ["Product Manager", "ScaleUp BV", "5d", "Joris van den Berg"],
      ["Data Scientist", "Innovatech", "1w", "Lotte Hendriks"],
    ],
  },
  {
    id: "in_behandeling",
    tone: "warning",
    title: "In behandeling",
    count: 8,
    cards: [
      ["Backend Developer", "Innovatech", "1d", "Daan Visser"],
      ["UX Designer", "Creative Minds", "3d", "Eva Smit"],
      ["DevOps Engineer", "CloudWorks", "4d", "Bram Mulder"],
    ],
  },
  {
    id: "gesprek",
    tone: "violet",
    title: "Gesprek",
    count: 6,
    cards: [
      ["Full Stack Developer", "Digital Agency", "1d", "Fleur de Boer"],
      ["Data Analyst", "DataWorks", "4d", "Ruben Peters"],
      ["QA Engineer", "QualityFirst", "1w", "Anouk Vos"],
    ],
  },
] as const;

function Kanban({ tr }: { tr: Tr }) {
  return (
    <section className="dk-kanban" aria-label={tr("demo.kit.kanban")}>
      {KANBAN.map((col) => (
        <section key={col.id} className={`dk-kanban__col dk-kanban__col--${col.tone}`}>
          <header>
            <h3>
              {col.title} ({col.count})
            </h3>
            <span aria-hidden="true">
              <Icon name="add" size={16} />
              <Icon name="more_horiz" size={16} />
            </span>
          </header>
          <ul>
            {col.cards.map(([role, company, age, person]) => (
              <li key={role}>
                <div>
                  <strong>{role}</strong>
                  <span>{company}</span>
                  <small>
                    <Icon name="event" size={16} /> {age}
                  </small>
                </div>
                <Avatar name={person} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}

const CITIES = ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"];

function Dropdown({ tr }: { tr: Tr }) {
  return (
    <div className="dk-dropdown">
      <div className="ts-field__control dk-icon-field dk-dropdown__search">
        <Icon name="search" size={20} />
        <input
          className="ts-field__input"
          placeholder={tr("demo.kit.searchOption")}
          aria-label={tr("demo.kit.dropdown")}
        />
        <Icon name="expand_more" size={20} />
      </div>
      <ul>
        {CITIES.map((city) => (
          <li key={city}>
            <button type="button" aria-pressed={city === "Rotterdam"}>
              {city}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DesignKitOverview({ locale }: { locale: Locale }) {
  const tr: Tr = (key, values) => t(locale, key, values);
  const [on, setOn] = useState(true),
    [off, setOff] = useState(false),
    [checked, setChecked] = useState(true),
    [radio, setRadio] = useState("1"),
    [slider, setSlider] = useState(75),
    [dark, setDark] = useState(true),
    [mail, setMail] = useState(true);
  const kpis = [
    {
      label: t(locale, "demo.elements.metrics.candidates"),
      value: 1248,
      icon: "person",
      tone: "info",
      delta: 12,
      s: [2, 3, 2, 4, 3, 5, 6, 7],
    },
    {
      label: tr("demo.kit.kpiVacancies"),
      value: 86,
      icon: "work",
      tone: "success",
      delta: 8,
      s: [3, 2, 4, 3, 5, 4, 6, 7],
    },
    {
      label: t(locale, "demo.elements.metrics.placements"),
      value: 34,
      icon: "handshake",
      tone: "violet",
      delta: 21,
      s: [4, 3, 4, 2, 3, 5, 4, 7],
    },
    {
      label: tr("demo.kit.kpiClients"),
      value: 48,
      icon: "business",
      tone: "info",
      delta: 5,
      s: [2, 2, 3, 3, 4, 4, 5, 6],
    },
  ] as const;
  return (
    <div className="dk-grid">
      {kpis.map((k) => (
        <div key={k.icon} className="dk-kpi">
          <Kpi
            label={k.label}
            value={k.value}
            icon={k.icon}
            tone={k.tone}
            delta={k.delta}
            values={[...k.s]}
            locale={locale}
          />
        </div>
      ))}
      <Panel className="dk-status" title={tr("demo.kit.statusLabels")}>
        <div className="dk-row">
          {RECRUITMENT_STAGE_IDS.map((stage) => (
            <StageBadge key={stage} stage={stage}>
              {t(locale, `recruitment.stage.${stage}`)}
            </StageBadge>
          ))}
          <FilterChip kind="add" onClick={noop}>
            {tr("demo.kit.addLabel")}
          </FilterChip>
        </div>
      </Panel>

      <Panel className="dk-fields" title={tr("demo.kit.fields")}>
        <div className="dk-fields__cols">
          <div className="dk-col">
            <TextField className="dk-focused" label={tr("demo.kit.textField")} placeholder={tr("demo.kit.firstName")} />
            <TextField label={tr("demo.kit.email")} type="email" placeholder={tr("demo.kit.emailPlaceholder")} />
            <TextField
              label={tr("demo.kit.password")}
              type="password"
              defaultValue="wachtwoord1"
              visibilityLabels={{ show: tr("demo.kit.showPassword"), hide: tr("demo.kit.hidePassword") }}
            />
            <TextField label={tr("demo.kit.search")} type="search" placeholder={tr("demo.kit.searchPlaceholder")} />
            <Textarea
              label={tr("demo.kit.textarea")}
              placeholder={tr("demo.kit.textareaPlaceholder")}
              maxLength={500}
            />
          </div>
          <div className="dk-col">
            <Select label={tr("demo.kit.select")} placeholder={tr("demo.kit.selectPlaceholder")} defaultValue="">
              <option value="amsterdam">Amsterdam</option>
              <option value="utrecht">Utrecht</option>
            </Select>
            <div className="ts-field">
              <span className="ts-field__label">{tr("demo.kit.multi")}</span>
              <div className="dk-multi">
                <ul>
                  {["JavaScript", "TypeScript", "React"].map((skill) => (
                    <li key={skill}>
                      {skill}
                      <button type="button" aria-label={`${tr("demo.kit.removeChip")} ${skill}`} onClick={noop}>
                        <Icon name="close" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
                <Icon name="expand_more" size={20} />
              </div>
            </div>
            <IconField label={tr("demo.kit.date1")} placeholder={tr("demo.kit.dateFormat")} icon="calendar_month" />
            <fieldset className="ts-field dk-fieldset">
              <legend className="ts-field__label">{tr("demo.kit.dateRange")}</legend>
              <div className="dk-pair">
                <IconField label={tr("demo.kit.from")} placeholder={tr("demo.kit.from")} icon="calendar_month" />
                <IconField label={tr("demo.kit.to")} placeholder={tr("demo.kit.to")} icon="calendar_month" />
              </div>
            </fieldset>
            <div className="dk-pair">
              <TextField label={tr("demo.kit.number")} type="number" placeholder="0" />
              <TextField label="URL" type="url" placeholder="https://" />
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="dk-toggles" title={tr("demo.kit.toggleCheckbox")}>
        <div className="dk-stack">
          <Switch label={tr("demo.kit.switchOn")} checked={on} onChange={setOn} />
          <Switch label={tr("demo.kit.switchOff")} checked={off} onChange={setOff} />
          <Checkbox label={tr("demo.kit.checked")} checked={checked} onChange={() => setChecked(!checked)} />
          <Checkbox label={tr("demo.kit.unchecked")} checked={false} onChange={noop} />
          <Checkbox label={tr("demo.kit.disabled")} checked disabled onChange={noop} />
        </div>
      </Panel>

      <div className="dk-radio-slider">
        <Panel className="dk-sub" title={tr("demo.kit.radioTitle")}>
          <RadioGroup
            label={tr("demo.kit.radioTitle")}
            value={radio}
            onChange={setRadio}
            options={[
              { value: "1", label: tr("demo.kit.radio1") },
              { value: "2", label: tr("demo.kit.radio2") },
              { value: "3", label: tr("demo.kit.radio3") },
              { value: "4", label: tr("demo.kit.disabled"), disabled: true },
            ]}
          />
        </Panel>
        <Panel className="dk-sub" title={tr("demo.kit.slider")}>
          <Slider label={tr("demo.kit.slider")} min={0} max={100} value={slider} onChange={setSlider} />
        </Panel>
      </div>

      <div className="dk-upload-switch">
        <Panel className="dk-sub" title={tr("demo.kit.upload")}>
          <div className="dk-drop">
            <Icon name="cloud_upload" size={24} />
            <span>{tr("demo.kit.dropFiles")}</span>
            <button type="button" className="dk-link">
              {tr("demo.kit.orClick")}
            </button>
          </div>
          <p className="dk-caption">{tr("demo.kit.supported")}</p>
        </Panel>
        <Panel className="dk-sub" title={tr("demo.kit.switches")}>
          <div className="dk-stack">
            <div className="dk-switch-row">
              <Icon name="dark_mode" size={20} />
              <Switch label={tr("demo.kit.darkMode")} checked={dark} onChange={setDark} />
            </div>
            <div className="dk-switch-row">
              <Icon name="mail" size={20} />
              <Switch label={tr("demo.kit.emailNotifications")} checked={mail} onChange={setMail} />
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="dk-buttons" title={tr("demo.kit.buttons")}>
        <div className="dk-btn-grid">
          <Button>{t(locale, "demo.elements.forms.kit.primary")}</Button>
          <Button variant="secondary">{t(locale, "demo.elements.forms.kit.secondary")}</Button>
          <Button variant="success">{t(locale, "demo.elements.forms.kit.success")}</Button>
          <Button variant="warning">{t(locale, "demo.elements.forms.kit.warning")}</Button>
          <Button variant="danger">{t(locale, "demo.elements.forms.kit.danger")}</Button>
          <Button variant="outline">{t(locale, "demo.elements.forms.kit.outline")}</Button>
          <Button icon="add">{tr("demo.kit.withIcon")}</Button>
          <Button variant="outline" icon="more_horiz" aria-label={tr("demo.kit.moreActions")} />
          <Button variant="secondary" disabled>
            {tr("demo.kit.disabled")}
          </Button>
        </div>
      </Panel>

      <Panel className="dk-chips" title={tr("demo.kit.filterChips")}>
        <div className="dk-row dk-row--chips">
          <FilterChip kind="toggle" pressed onPressedChange={noop}>
            {t(locale, "demo.elements.overview.filters")}
          </FilterChip>
          <FilterChip kind="dropdown" onClick={noop}>
            {t(locale, "demo.elements.overview.activeFilters")}
          </FilterChip>
          {(["demo.elements.overview.function", "demo.elements.overview.locationChip"] as const).map((key) => (
            <FilterChip
              key={key}
              kind="removable"
              removeLabel={tr("demo.kit.removeFilter", { name: t(locale, key) })}
              onRemove={noop}
            >
              {t(locale, key)}
            </FilterChip>
          ))}
          <FilterChip kind="add" onClick={noop}>
            {tr("demo.kit.addFilter")}
          </FilterChip>
        </div>
      </Panel>

      <Panel className="dk-table" title={tr("demo.kit.dataTable")}>
        <section className="dk-table__scroll" aria-label={tr("demo.kit.dataTable")}>
          <table>
            <thead>
              <tr>
                <th scope="col">
                  <input type="checkbox" aria-label={tr("demo.kit.colSelect")} />
                </th>
                <th scope="col">{t(locale, "demo.elements.overview.name")}</th>
                <th scope="col">{t(locale, "demo.elements.overview.role")}</th>
                <th scope="col">{t(locale, "demo.elements.overview.location")}</th>
                <th scope="col">{t(locale, "demo.elements.overview.status")}</th>
                <th scope="col">{tr("demo.kit.colDate")}</th>
                <th scope="col">{tr("demo.kit.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((row) => (
                <tr key={row.name}>
                  <td>
                    <input type="checkbox" aria-label={tr("demo.kit.selectRow", { name: row.name })} />
                  </td>
                  <td>
                    <span className="dk-name">
                      <Avatar name={row.name} size="sm" />
                      <strong>{row.name}</strong>
                    </span>
                  </td>
                  <td>{row.role}</td>
                  <td>{row.city}</td>
                  <td>
                    <StageBadge stage={row.stage}>{t(locale, `recruitment.stage.${row.stage}`)}</StageBadge>
                  </td>
                  <td>{row.date}</td>
                  <td>
                    <Button variant="ghost" icon="more_horiz" aria-label={tr("demo.kit.moreActions")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </Panel>

      <Panel className="dk-kanban-panel" title={tr("demo.kit.kanban")}>
        <Kanban tr={tr} />
      </Panel>

      <Panel className="dk-date" title={tr("demo.kit.datePicker")}>
        <Calendar tr={tr} locale={locale} />
      </Panel>

      <Panel className="dk-dropdown-panel" title={tr("demo.kit.dropdown")}>
        <Dropdown tr={tr} />
      </Panel>

      <Panel className="dk-toasts" title={tr("demo.kit.tooltipTitle")}>
        <div className="dk-tip">
          <Tooltip inline content={t(locale, "demo.elements.overview.tip")}>
            <Button variant="ghost" icon="info" aria-label={t(locale, "demo.elements.overview.tip")} />
          </Tooltip>
        </div>
        <div className="dk-toast-list">
          {(
            [
              ["success", "toastSaved"],
              ["info", "toastInfo"],
              ["warning", "toastWarn"],
              ["danger", "toastErr"],
            ] as const
          ).map(([tone, key]) => (
            <Toast
              key={tone}
              tone={tone}
              title={tr(`demo.kit.${key}Title`)}
              closeLabel={tr("demo.kit.toastClose")}
              onDismiss={noop}
              duration={0}
            >
              {tr(`demo.kit.${key}Body`)}
            </Toast>
          ))}
        </div>
      </Panel>
    </div>
  );
}
