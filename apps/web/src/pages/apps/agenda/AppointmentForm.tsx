import { useEffect, useId } from "react";
import { Badge, Button, Combobox, Switch } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { useAppForm, FormSummary, submitForm } from "../../../forms.tsx";
import { AGENDA_USERS } from "../../../demo/apps.ts";
import { appointmentSchema, conflicts, eventFromDraft } from "./agenda.ts";
import type { Appointment, AppointmentDraft } from "./agenda.ts";

export function AppointmentForm({
  locale,
  initial,
  eventId,
  events,
  onSave,
  onCancel,
  onTarget,
}: {
  locale: Locale;
  initial: AppointmentDraft;
  eventId: string;
  events: readonly Appointment[];
  onSave: (event: Appointment) => void;
  onCancel: () => void;
  /** Reports the chosen date/time while moving, so the calendar can highlight that target. */
  onTarget?: (target: { date: string; start: string; allDay: boolean } | null) => void;
}) {
  const id = useId();
  useEffect(() => {
    document.getElementById(`${id}-title`)?.focus();
  }, [id]);
  const tr = (key: MessageKey, values?: Record<string, string | number>) => t(locale, key, values);
  const form = useAppForm({
    defaultValues: initial,
    validators: { onBlur: appointmentSchema, onSubmit: appointmentSchema },
    onSubmit: ({ value }) => onSave(eventFromDraft(appointmentSchema.parse(value), eventId)),
  });
  const fields = [
    ["title", "demo.apps.agenda.form.name", "text"],
    ["date", "demo.apps.agenda.start_date", "date"],
    ["endDate", "demo.apps.agenda.end_date", "date"],
    ["start", "demo.apps.agenda.start_time", "time"],
    ["end", "demo.apps.agenda.end_time", "time"],
    ["link", "demo.apps.agenda.link", "url"],
    ["description", "demo.apps.agenda.description", "text"],
    ["location", "demo.apps.agenda.location", "text"],
  ] as const;
  return (
    <form.AppForm>
      {onTarget && (
        <form.Subscribe selector={(state) => state.values}>
          {(value) => <TargetReporter value={value} onTarget={onTarget} />}
        </form.Subscribe>
      )}
      <form
        className="ag-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm(form);
        }}
      >
        <FormSummary
          locale={locale}
          fields={Object.fromEntries(fields.map(([name, key]) => [name, { id: `${id}-${name}`, label: tr(key) }]))}
        />
        <form.AppField name="title">
          {(field) => (
            <field.Text locale={locale} id={`${id}-title`} label={tr("demo.apps.agenda.form.name")} required />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.Area locale={locale} id={`${id}-description`} label={tr("demo.apps.agenda.description")} rows={3} />
          )}
        </form.AppField>
        <form.AppField name="type">
          {(field) => (
            <field.Choice locale={locale} label={tr("demo.apps.agenda.form.type")}>
              <option value="gesprek">{tr("demo.apps.agenda.type.gesprek")}</option>
              <option value="intake">{tr("demo.apps.agenda.type.intake")}</option>
              <option value="deadline">{tr("demo.apps.agenda.type.deadline")}</option>
            </field.Choice>
          )}
        </form.AppField>
        <form.AppField name="allDay">
          {(field) => (
            <Switch label={tr("demo.apps.agenda.all_day")} checked={field.state.value} onChange={field.handleChange} />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.allDay}>
          {(allDay) => (
            <div className="ag-form__times">
              {fields.slice(1, allDay ? 3 : 5).map(([name, key, type]) => (
                <form.AppField key={name} name={name}>
                  {(field) => (
                    <field.Text
                      locale={locale}
                      id={`${id}-${name}`}
                      label={tr(key)}
                      type={type}
                      required
                      step={type === "time" ? 900 : undefined}
                    />
                  )}
                </form.AppField>
              ))}
            </div>
          )}
        </form.Subscribe>
        <form.AppField name="attendees">
          {(field) => (
            <>
              <Combobox
                label={tr("demo.apps.agenda.attendees")}
                multiple
                options={AGENDA_USERS.map((user) => ({ value: user.id, label: user.name }))}
                value={field.state.value.map((guest) => guest.userId)}
                onChange={(ids) =>
                  field.handleChange(
                    ids.map(
                      (userId) =>
                        field.state.value.find((guest) => guest.userId === userId) ?? { userId, required: true },
                    ),
                  )
                }
                emptyLabel={tr("demo.apps.agenda.empty_users")}
                removeLabel={(name) => tr("demo.apps.agenda.remove_user", { name })}
              />
              {field.state.value.map((guest) => (
                <div className="ag-form__guest" key={guest.userId}>
                  <span>{AGENDA_USERS.find((user) => user.id === guest.userId)?.name}</span>
                  <Switch
                    label={tr("demo.apps.agenda.required")}
                    aria-label={`${AGENDA_USERS.find((user) => user.id === guest.userId)?.name}: ${tr("demo.apps.agenda.required")}`}
                    checked={guest.required}
                    onChange={(required) =>
                      field.handleChange(
                        field.state.value.map((item) => (item.userId === guest.userId ? { ...item, required } : item)),
                      )
                    }
                  />
                  <Badge>{tr(guest.required ? "demo.apps.agenda.required" : "demo.apps.agenda.optional")}</Badge>
                </div>
              ))}
            </>
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values}>
          {(value) => {
            if (!value.date || !value.endDate) return null;
            const names = conflicts(eventFromDraft(value, eventId), events)
              .map((userId) => AGENDA_USERS.find((user) => user.id === userId)?.name)
              .join(", ");
            return names ? (
              <p className="ag-form__conflict" role="note">
                {tr("demo.apps.agenda.conflict", { names })}
              </p>
            ) : null;
          }}
        </form.Subscribe>
        <form.AppField name="organiser">
          {(field) => (
            <field.Choice locale={locale} label={tr("demo.apps.agenda.organiser")}>
              {AGENDA_USERS.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </field.Choice>
          )}
        </form.AppField>
        <form.AppField name="private">
          {(field) => (
            <Switch label={tr("demo.apps.agenda.private")} checked={field.state.value} onChange={field.handleChange} />
          )}
        </form.AppField>
        <form.AppField name="location">
          {(field) => <field.Text locale={locale} id={`${id}-location`} label={tr("demo.apps.agenda.location")} />}
        </form.AppField>
        <form.AppField name="online">
          {(field) => (
            <Switch label={tr("demo.apps.agenda.online")} checked={field.state.value} onChange={field.handleChange} />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.online}>
          {(online) =>
            online && (
              <form.AppField name="link">
                {(field) => (
                  <field.Text
                    locale={locale}
                    id={`${id}-link`}
                    label={tr("demo.apps.agenda.link")}
                    type="url"
                    required
                  />
                )}
              </form.AppField>
            )
          }
        </form.Subscribe>
        <div className="ag-form__footer">
          <Button variant="outline" onClick={onCancel}>
            {tr("demo.apps.agenda.form.cancel")}
          </Button>
          <Button type="submit">{tr("demo.apps.agenda.form.save")}</Button>
        </div>
      </form>
    </form.AppForm>
  );
}

function TargetReporter({
  value,
  onTarget,
}: {
  value: AppointmentDraft;
  onTarget: (target: { date: string; start: string; allDay: boolean } | null) => void;
}) {
  const { date, start, allDay } = value;
  useEffect(() => {
    onTarget(date ? { date, start, allDay } : null);
  }, [date, start, allDay, onTarget]);
  useEffect(() => () => onTarget(null), [onTarget]);
  return null;
}
