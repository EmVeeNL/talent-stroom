import { createFormHook, createFormHookContexts, formEventClient, useStore } from "@tanstack/react-form";
import { TextField, Textarea, Select, Checkbox, RadioGroup, ErrorSummary } from "@talentstroom/ui";
import type { TextFieldProps, TextareaProps, SelectProps, CheckboxProps, RadioGroupProps } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";

// Form 1.33.5 broadcasts values/options by default and queues them without a devtools UI.
// Disable both broadcasts and devtools commands before any form is mounted.
// Keep this explicit privacy boundary when upgrading Form; no Form devtools are installed.
formEventClient.emit = () => {};
formEventClient.on = () => () => {};

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

// Never render schema/server messages: only allowlisted issue codes become catalog keys.
export function issueMessage(locale: Locale, errors: readonly unknown[], name: string): string | undefined {
  const issue = errors.find((error) => error && typeof error === "object");
  if (!issue || typeof issue !== "object") return undefined;
  const code = "code" in issue ? issue.code : undefined;
  let key: MessageKey = "form.invalid";
  if (name === "password" && (code === "too_small" || code === "too_big")) key = "form.password";
  else if (code === "invalid_format" && name === "email") key = "form.email";
  else if (code === "too_big") key = "form.tooLong";
  else if (name === "title" && code === "too_small") key = "demo.apps.agenda.error.title";
  else if ((name === "date" || name === "endDate") && code === "invalid_format") key = "demo.apps.agenda.error.date";
  else if (["start", "end", "endDate"].includes(name) && code === "custom") key = "demo.apps.agenda.error.time";
  return t(locale, key);
}

function Text({ locale, ...props }: TextFieldProps & { locale: Locale }) {
  const field = useFieldContext<string>();
  const error = issueMessage(locale, field.state.meta.errors, field.name);
  return (
    <TextField
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      {...(error ? { error } : {})}
    />
  );
}
function Area({ locale, ...props }: TextareaProps & { locale: Locale }) {
  const field = useFieldContext<string>();
  const error = issueMessage(locale, field.state.meta.errors, field.name);
  return (
    <Textarea
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      {...(error ? { error } : {})}
    />
  );
}
function Choice({ locale, ...props }: SelectProps & { locale: Locale }) {
  const field = useFieldContext<string>();
  const error = issueMessage(locale, field.state.meta.errors, field.name);
  return (
    <Select
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      {...(error ? { error } : {})}
    />
  );
}
function Check({ locale, id, label, ...props }: CheckboxProps & { locale: Locale; id: string }) {
  const field = useFieldContext<boolean>();
  const error = issueMessage(locale, field.state.meta.errors, field.name);
  return (
    <Checkbox
      {...props}
      id={id}
      label={label}
      name={field.name}
      checked={field.state.value}
      onChange={(e) => field.handleChange(e.target.checked)}
      onBlur={field.handleBlur}
      {...(error ? { error } : {})}
    />
  );
}
function Radios({ locale, ...props }: RadioGroupProps & { locale: Locale }) {
  const field = useFieldContext<string>();
  const error = issueMessage(locale, field.state.meta.errors, field.name);
  return (
    <RadioGroup
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      {...(error ? { error } : {})}
    />
  );
}
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { Text, Area, Choice, Check, Radios },
  formComponents: {},
});

export function FormSummary({
  locale,
  fields,
}: {
  locale: Locale;
  fields: Record<string, { id: string; label: string }>;
}) {
  const form = useFormContext();
  const meta: Record<string, { errors: readonly unknown[] } | undefined> = useStore(
    form.store,
    (state) => state.fieldMeta,
  );
  const attempts = useStore(form.store, (state) => state.submissionAttempts);
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  const errors = Object.entries(fields).flatMap(([name, info]) => {
    const message = issueMessage(locale, meta[name]?.errors ?? [], name);
    return message ? [{ ...info, message }] : [];
  });
  return <ErrorSummary title={t(locale, "form.summary")} errors={errors} focusRequest={submitting ? 0 : attempts} />;
}

/** Revalidate on first submit, including stale blur errors, while rejecting concurrent submits. */
export function submitForm(form: {
  state: { isSubmitting: boolean };
  validateSync: (cause: "submit") => unknown;
  handleSubmit: () => Promise<void>;
}) {
  if (form.state.isSubmitting) return Promise.resolve();
  // Form 1.33.5 checks field validity before running form validators. Refresh stale
  // blur issues first so keyboard submit and checkbox changes work on the first try.
  form.validateSync("submit");
  return form.handleSubmit();
}
