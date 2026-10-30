import { ProblemError } from "../../query.ts";
import { useDataLayer } from "../../QueryProvider.tsx";
import { useState } from "react";
import { CreateOrganizationRequest, OrganizationIdParam } from "@talentstroom/contracts";
import { useAppForm, FormSummary, submitForm } from "../../forms.tsx";
import { Button } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { errorKey, isAborted, RequestError } from "../../auth.ts";
import type { OrganizationList, Transport } from "../../auth.ts";

const roleLabels = {
  owner: "auth.roleOwner",
  admin: "auth.roleAdmin",
  recruiter: "auth.roleRecruiter",
  viewer: "auth.roleViewer",
} satisfies Record<OrganizationList["organizations"][number]["role"], MessageKey>;

export function OrganizationPicker({
  data,
  locale,
  transport,
  onChanged,
  onExpired,
}: {
  data: OrganizationList;
  locale: Locale;
  transport: Transport;
  onChanged: () => void;
  onExpired: () => void;
}) {
  const layer = useDataLayer();
  const tr = (key: MessageKey) => t(locale, key);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  const createForm = useAppForm({
    defaultValues: { name: "" },
    validators: { onBlur: CreateOrganizationRequest, onSubmit: CreateOrganizationRequest },
    onSubmit: async ({ value }) => change(CreateOrganizationRequest.parse(value)),
  });
  const pickForm = useAppForm({
    defaultValues: { orgId: "" },
    validators: { onBlur: OrganizationIdParam, onSubmit: OrganizationIdParam },
    onSubmit: async ({ value }) => change(OrganizationIdParam.parse(value)),
  });
  async function change(request: { name: string } | { orgId: string }) {
    const name = "name" in request ? request.name : undefined;
    const selected = "orgId" in request ? request.orgId : "";
    if (busy) return;
    setBusy(true);
    setError(undefined);
    if (!layer) transport.cancel();
    const signal = transport.signal;
    try {
      if (layer) {
        await layer.changeOrganization(transport, name !== undefined ? { name } : { orgId: selected });
        onChanged();
        return;
      }
      const result =
        name !== undefined
          ? await transport.api.POST("/v1/organizations", { body: { name }, signal })
          : await transport.api.POST("/v1/organizations/{orgId}/switch", {
              params: { path: { orgId: selected ?? "" } },
              signal,
            });
      signal.throwIfAborted();
      if (!result.data) throw new RequestError(result.response.status);
      onChanged();
    } catch (err) {
      if (isAborted(err)) return;
      if (err instanceof RequestError && err.status === 401) onExpired();
      else if (name !== undefined && err instanceof ProblemError && err.fields.length) {
        const issues = err.fields.map((field) => ({ code: field.code, path: [field.path], message: "" }));
        createForm.setFieldMeta("name", (previous) => ({
          ...previous,
          errorMap: { ...previous.errorMap, onSubmit: issues },
        }));
      } else setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }
  const options = data.organizations.map((org) => ({
    value: org.organizationId,
    label: org.name,
    avatar: org.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join(""),
    badge: tr(roleLabels[org.role]),
    ...(data.activeOrganizationId === org.organizationId ? { description: tr("auth.active") } : {}),
  }));
  return (
    <div className="org-picker">
      <p>{tr(data.organizations.length ? "auth.chooseIntro" : "auth.empty")}</p>
      {error && <p role="alert">{tr(error)}</p>}
      {options.length > 0 && (
        <pickForm.AppForm>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void submitForm(pickForm);
            }}
          >
            <FormSummary locale={locale} fields={{ orgId: { id: "org-choice", label: tr("auth.picker") } }} />
            <pickForm.AppField name="orgId">
              {(field) => (
                <>
                  <field.Radios
                    id="org-choice"
                    locale={locale}
                    label={tr("auth.picker")}
                    options={options}
                    card
                    disabled={busy}
                  />
                  {data.organizations
                    .filter((org) => org.organizationId === field.state.value)
                    .map((chosen) => (
                      <div className="org-confirm" key={chosen.organizationId}>
                        <p>{t(locale, "auth.confirmOrg", { name: chosen.name })}</p>
                        <Button type="submit" loading={busy} loadingLabel={tr("auth.loading")}>
                          {tr("auth.openOrg")}
                        </Button>
                      </div>
                    ))}
                </>
              )}
            </pickForm.AppField>
          </form>
        </pickForm.AppForm>
      )}
      <createForm.AppForm>
        <form
          noValidate
          aria-label={tr("auth.newOrg")}
          onSubmit={(event) => {
            event.preventDefault();
            if (!busy) void submitForm(createForm);
          }}
          aria-busy={busy}
        >
          <FormSummary locale={locale} fields={{ name: { id: "org-name", label: tr("auth.orgName") } }} />
          <h2>{tr("auth.newOrg")}</h2>
          <fieldset disabled={busy} className="auth-fields">
            <createForm.AppField name="name">
              {(field) => (
                <field.Text
                  id="org-name"
                  locale={locale}
                  label={tr("auth.orgName")}
                  placeholder={tr("auth.orgNamePlaceholder")}
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="organization"
                />
              )}
            </createForm.AppField>
            <Button type="submit" loading={busy} loadingLabel={tr("auth.loading")}>
              {tr("auth.createOrg")}
            </Button>
          </fieldset>
        </form>
      </createForm.AppForm>
    </div>
  );
}
