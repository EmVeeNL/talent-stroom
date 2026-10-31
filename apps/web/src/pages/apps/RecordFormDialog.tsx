import { useId } from "react";
import { z } from "zod";
import { Checkbox, FormDialog } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { FormSummary, submitForm, useAppForm } from "../../forms.tsx";

export function formDialogLabels(locale: Locale) {
  return {
    cancel: t(locale, "patterns.cancel"),
    save: t(locale, "patterns.save"),
    discardTitle: t(locale, "patterns.discardTitle"),
    discardBody: t(locale, "patterns.discardBody"),
    keepEditing: t(locale, "patterns.keepEditing"),
    discard: t(locale, "patterns.discard"),
  };
}
export interface RecordField {
  name: string;
  label: MessageKey;
  hint?: MessageKey;
  required?: boolean;
  area?: boolean;
  checkbox?: boolean;
  options?: readonly { value: string; label: string }[];
}
/** Demo-only, memory-only editor; uses the app's privacy-hardened TanStack Form setup. Mount per edit session. */
export function RecordFormDialog({
  locale,
  title,
  initial,
  fields,
  onSave,
  onClose,
}: {
  locale: Locale;
  title?: string;
  initial: Record<string, string>;
  fields: readonly RecordField[];
  onSave: (value: Record<string, string>) => void;
  onClose: () => void;
}) {
  const id = useId();
  const schema = z.record(z.string(), z.string()).superRefine((values, ctx) => {
    for (const field of fields) {
      const value = values[field.name] ?? "";
      if (
        (field.required && !value.trim()) ||
        value.length > 10000 ||
        (field.options && !field.options.some((option) => option.value === value))
      ) {
        ctx.addIssue({ code: "custom", path: [field.name], message: "invalid" });
      }
    }
  });
  const form = useAppForm({
    defaultValues: initial,
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => onSave(schema.parse(value)),
  });
  return (
    <form.AppForm>
      <form.Subscribe selector={(state) => [state.isDirty, state.isSubmitting] as const}>
        {([dirty, submitting]) => (
          <FormDialog
            title={title ?? t(locale, "patterns.edit")}
            triggerLabel={t(locale, "patterns.edit")}
            closeLabel={t(locale, "patterns.close")}
            hideTrigger
            open
            dirty={dirty}
            submitting={submitting}
            formId={id}
            labels={formDialogLabels(locale)}
            onOpenChange={(next) => {
              if (!next) onClose();
            }}
          >
            <form
              id={id}
              className="ts-form-dialog__fields"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void submitForm(form);
              }}
            >
              <FormSummary
                locale={locale}
                fields={Object.fromEntries(
                  fields.map((field) => [field.name, { id: `${id}-${field.name}`, label: t(locale, field.label) }]),
                )}
              />
              {fields.map((item) => (
                <form.AppField key={item.name} name={item.name}>
                  {(field) =>
                    item.checkbox ? (
                      <Checkbox
                        label={t(locale, item.label)}
                        checked={field.state.value === "true"}
                        onChange={(event) => field.handleChange(String(event.target.checked))}
                      />
                    ) : item.options ? (
                      <field.Choice id={`${id}-${item.name}`} locale={locale} label={t(locale, item.label)}>
                        {item.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </field.Choice>
                    ) : item.area ? (
                      <field.Area
                        id={`${id}-${item.name}`}
                        locale={locale}
                        label={t(locale, item.label)}
                        rows={4}
                        {...(item.hint ? { hint: t(locale, item.hint) } : {})}
                        required={item.required ?? false}
                      />
                    ) : (
                      <field.Text
                        id={`${id}-${item.name}`}
                        locale={locale}
                        label={t(locale, item.label)}
                        {...(item.hint ? { hint: t(locale, item.hint) } : {})}
                        required={item.required ?? false}
                      />
                    )
                  }
                </form.AppField>
              ))}
            </form>
          </FormDialog>
        )}
      </form.Subscribe>
    </form.AppForm>
  );
}
