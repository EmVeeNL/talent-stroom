import { useState } from "react";
import type { FormEvent } from "react";
import { Button, RadioGroup, TextField } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { errorKey, isAborted, RequestError } from "./auth.ts";
import type { OrganizationList, Transport } from "./auth.ts";

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
  const tr = (key: MessageKey) => t(locale, key);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  async function change(name?: string) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    transport.cancel();
    const signal = transport.signal;
    try {
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
      else setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name");
    if (typeof name === "string") void change(name.trim());
  }
  const chosen = data.organizations.find((org) => org.organizationId === selected);
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
        <RadioGroup
          label={tr("auth.picker")}
          options={options}
          value={selected}
          onChange={(value) => setSelected(value)}
          name="organization"
          card
          disabled={busy}
        />
      )}
      {chosen && (
        <div className="org-confirm">
          <p>{t(locale, "auth.confirmOrg", { name: chosen.name })}</p>
          <Button loading={busy} loadingLabel={tr("auth.loading")} onClick={() => void change()}>
            {tr("auth.openOrg")}
          </Button>
        </div>
      )}
      <form aria-label={tr("auth.newOrg")} onSubmit={create} aria-busy={busy}>
        <h2>{tr("auth.newOrg")}</h2>
        <fieldset disabled={busy} className="auth-fields">
          <TextField
            name="name"
            label={tr("auth.orgName")}
            placeholder={tr("auth.orgNamePlaceholder")}
            required
            minLength={2}
            maxLength={100}
            autoComplete="organization"
          />
          <Button type="submit" loading={busy} loadingLabel={tr("auth.loading")}>
            {tr("auth.createOrg")}
          </Button>
        </fieldset>
      </form>
    </div>
  );
}
