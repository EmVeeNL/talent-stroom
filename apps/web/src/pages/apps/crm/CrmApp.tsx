/* oxlint-disable react/no-unstable-nested-components -- render props of ui components (Dialog footer, DataTable cells) */
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Avatar, Button, DataTable, SearchInput, Select, Sheet, StatCard, StatusPill, Tabs } from "@talentstroom/ui";
import type { DataColumn } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { CRM_COMPANIES, CRM_CONTACTS, CRM_DEALS } from "../../../demo/apps.ts";
import type { CrmCompany, CrmContact, CrmDeal, DealStage } from "../../../demo/apps.ts";
import { fromIso } from "../agenda/dates.ts";
import { DEAL_TONES, formatEuro, openValue, wonValue } from "./format.ts";
import "./crm.css";

interface Detail {
  kind: "company" | "contact" | "deal";
  id: string;
}
type Tr = (key: MessageKey, values?: Record<string, string | number>) => string;

const DEAL_STAGES: readonly DealStage[] = ["lead", "voorstel", "onderhandeling", "gewonnen", "verloren"];
const DEAL_STAGE_KEYS: Record<DealStage, MessageKey> = {
  lead: "demo.apps.crm.stage.lead",
  voorstel: "demo.apps.crm.stage.voorstel",
  onderhandeling: "demo.apps.crm.stage.onderhandeling",
  gewonnen: "demo.apps.crm.stage.gewonnen",
  verloren: "demo.apps.crm.stage.verloren",
};
const STATUS_KEYS = {
  actief: "demo.apps.crm.status.actief",
  prospect: "demo.apps.crm.status.prospect",
  inactief: "demo.apps.crm.status.inactief",
} as const satisfies Record<CrmCompany["status"], MessageKey>;
const STATUS_IDS = ["actief", "prospect", "inactief"] as const;
const STATUS_TONES = { actief: "success", prospect: "info", inactief: "neutral" } as const;

const company = (id: string) => CRM_COMPANIES.find((candidate) => candidate.id === id);
const contact = (id: string) => CRM_CONTACTS.find((candidate) => candidate.id === id);
const includes = (text: string, query: string) =>
  text.toLocaleLowerCase("nl-NL").includes(query.trim().toLocaleLowerCase("nl-NL"));

export function CrmApp({ locale }: { locale: Locale }) {
  const tr: Tr = (key, values) => t(locale, key, values);
  const [detail, setDetail] = useState<Detail | undefined>();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const show = (kind: Detail["kind"], id: string, element: HTMLElement) => {
    opener.current = element;
    setDetail({ kind, id });
    setOpen(true);
  };

  return (
    <div className="crm">
      <div className="crm__stats">
        <StatCard
          label={tr("demo.apps.crm.stat.open")}
          value={openValue(CRM_DEALS)}
          formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
          icon="euro"
        />
        <StatCard
          label={tr("demo.apps.crm.stat.won")}
          value={wonValue(CRM_DEALS)}
          formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
          icon="emoji_events"
          tone="success"
        />
        <StatCard
          label={tr("demo.apps.crm.stat.active")}
          value={CRM_COMPANIES.filter((entry) => entry.status === "actief").length}
          icon="business"
          tone="violet"
        />
      </div>
      <Tabs
        label={tr("demo.apps.crm.tabs")}
        className="crm__tabs"
        tabs={[
          {
            id: "bedrijven",
            label: tr("demo.apps.crm.tab.companies"),
            icon: "business",
            panel: <CompaniesPanel tr={tr} onOpen={(id, el) => show("company", id, el)} />,
          },
          {
            id: "contactpersonen",
            label: tr("demo.apps.crm.tab.contacts"),
            icon: "contacts",
            panel: <ContactsPanel tr={tr} onOpen={(id, el) => show("contact", id, el)} />,
          },
          {
            id: "deals",
            label: tr("demo.apps.crm.tab.deals"),
            icon: "handshake",
            panel: <DealsPanel tr={tr} locale={locale} onOpen={(id, el) => show("deal", id, el)} />,
          },
        ]}
      />
      <Sheet
        title={detail ? detailTitle(detail) : ""}
        triggerLabel={tr("demo.apps.crm.open")}
        closeLabel={tr("demo.apps.crm.close")}
        hideTrigger
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) opener.current?.focus();
        }}
        footer={(close) => (
          <Button variant="outline" onClick={close}>
            {tr("demo.apps.crm.close")}
          </Button>
        )}
      >
        {detail && <DetailBody detail={detail} tr={tr} locale={locale} onOpen={show} />}
      </Sheet>
    </div>
  );
}

function detailTitle(detail: Detail): string {
  if (detail.kind === "company") return company(detail.id)?.name ?? "";
  if (detail.kind === "contact") return contact(detail.id)?.name ?? "";
  return CRM_DEALS.find((deal) => deal.id === detail.id)?.title ?? "";
}

function Toolbar({
  tr,
  query,
  onQuery,
  filter,
}: {
  tr: Tr;
  query: string;
  onQuery: (value: string) => void;
  filter: ReactNode;
}) {
  return (
    <div className="crm__toolbar">
      <SearchInput
        label={tr("demo.apps.crm.search")}
        clearLabel={tr("demo.apps.crm.search_clear")}
        placeholder={tr("demo.apps.crm.search_placeholder")}
        value={query}
        onChange={onQuery}
        searchLandmark
      />
      {filter}
    </div>
  );
}

function LinkButton({ children, onOpen }: { children: ReactNode; onOpen: (element: HTMLElement) => void }) {
  return (
    <button type="button" className="crm__link" onClick={(event) => onOpen(event.currentTarget)}>
      {children}
    </button>
  );
}

function tableProps(tr: Tr) {
  return {
    scrollLabel: tr("demo.apps.crm.scroll"),
    emptyLabel: tr("demo.apps.crm.empty"),
    loadingLabel: tr("demo.apps.crm.loading"),
  };
}

function CompaniesPanel({ tr, onOpen }: { tr: Tr; onOpen: (id: string, element: HTMLElement) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const rows = CRM_COMPANIES.filter(
    (entry) =>
      (!query.trim() || includes(`${entry.name} ${entry.city} ${entry.sector}`, query)) &&
      (!status || entry.status === status),
  );
  const columns: DataColumn<CrmCompany>[] = [
    {
      id: "name",
      label: tr("demo.apps.crm.col.company"),
      sortValue: (row) => row.name,
      cell: (row) => (
        <LinkButton onOpen={(el) => onOpen(row.id, el)}>
          {row.name}
          <span className="ts-visually-hidden"> {tr("demo.apps.crm.view_details")}</span>
        </LinkButton>
      ),
    },
    { id: "sector", label: tr("demo.apps.crm.col.sector"), sortValue: (row) => row.sector, cell: (row) => row.sector },
    { id: "city", label: tr("demo.apps.crm.col.city"), sortValue: (row) => row.city, cell: (row) => row.city },
    { id: "owner", label: tr("demo.apps.crm.col.owner"), cell: (row) => row.owner },
    {
      id: "vacancies",
      label: tr("demo.apps.crm.col.vacancies"),
      sortValue: (row) => row.vacancies,
      cell: (row) => row.vacancies,
    },
    {
      id: "status",
      label: tr("demo.apps.crm.col.status"),
      cell: (row) => <StatusPill tone={STATUS_TONES[row.status]}>{tr(STATUS_KEYS[row.status])}</StatusPill>,
    },
  ];
  return (
    <>
      <Toolbar
        tr={tr}
        query={query}
        onQuery={setQuery}
        filter={
          <Select
            label={tr("demo.apps.crm.col.status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder={tr("demo.apps.crm.all")}
          >
            {STATUS_IDS.map((key) => (
              <option key={key} value={key}>
                {tr(STATUS_KEYS[key])}
              </option>
            ))}
          </Select>
        }
      />
      <DataTable
        caption={tr("demo.apps.crm.tab.companies")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        {...tableProps(tr)}
      />
    </>
  );
}

function ContactsPanel({ tr, onOpen }: { tr: Tr; onOpen: (id: string, element: HTMLElement) => void }) {
  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState("");
  const rows = CRM_CONTACTS.filter(
    (entry) =>
      (!query.trim() || includes(`${entry.name} ${entry.function} ${company(entry.companyId)?.name ?? ""}`, query)) &&
      (!companyId || entry.companyId === companyId),
  );
  const columns: DataColumn<CrmContact>[] = [
    {
      id: "name",
      label: tr("demo.apps.crm.col.name"),
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="crm__person">
          <Avatar name={row.name} size="sm" />
          <LinkButton onOpen={(el) => onOpen(row.id, el)}>
            {row.name}
            <span className="ts-visually-hidden"> {tr("demo.apps.crm.view_details")}</span>
          </LinkButton>
        </span>
      ),
    },
    { id: "function", label: tr("demo.apps.crm.col.function"), cell: (row) => row.function },
    {
      id: "company",
      label: tr("demo.apps.crm.col.company"),
      sortValue: (row) => company(row.companyId)?.name ?? "",
      cell: (row) => company(row.companyId)?.name,
    },
    {
      id: "email",
      label: tr("demo.apps.crm.col.email"),
      cell: (row) => <a href={`mailto:${row.email}`}>{row.email}</a>,
    },
    { id: "phone", label: tr("demo.apps.crm.col.phone"), cell: (row) => row.phone },
  ];
  return (
    <>
      <Toolbar
        tr={tr}
        query={query}
        onQuery={setQuery}
        filter={
          <Select
            label={tr("demo.apps.crm.col.company")}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder={tr("demo.apps.crm.all")}
          >
            {CRM_COMPANIES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </Select>
        }
      />
      <DataTable
        caption={tr("demo.apps.crm.tab.contacts")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        {...tableProps(tr)}
      />
    </>
  );
}

function DealsPanel({
  tr,
  locale,
  onOpen,
}: {
  tr: Tr;
  locale: Locale;
  onOpen: (id: string, element: HTMLElement) => void;
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const date = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  );
  const rows = CRM_DEALS.filter(
    (entry) =>
      (!query.trim() || includes(`${entry.title} ${company(entry.companyId)?.name ?? ""}`, query)) &&
      (!stage || entry.stage === stage),
  );
  const columns: DataColumn<CrmDeal>[] = [
    {
      id: "title",
      label: tr("demo.apps.crm.col.deal"),
      sortValue: (row) => row.title,
      cell: (row) => (
        <LinkButton onOpen={(el) => onOpen(row.id, el)}>
          {row.title}
          <span className="ts-visually-hidden"> {tr("demo.apps.crm.view_details")}</span>
        </LinkButton>
      ),
    },
    {
      id: "company",
      label: tr("demo.apps.crm.col.company"),
      sortValue: (row) => company(row.companyId)?.name ?? "",
      cell: (row) => company(row.companyId)?.name,
    },
    {
      id: "stage",
      label: tr("demo.apps.crm.col.stage"),
      cell: (row) => <StatusPill tone={DEAL_TONES[row.stage]}>{tr(DEAL_STAGE_KEYS[row.stage])}</StatusPill>,
    },
    {
      id: "amount",
      label: tr("demo.apps.crm.col.amount"),
      sortValue: (row) => row.amount,
      cell: (row) => <span className="crm__amount">{formatEuro(row.amount)}</span>,
    },
    {
      id: "close",
      label: tr("demo.apps.crm.col.close_date"),
      sortValue: (row) => row.closeDate,
      cell: (row) => date.format(fromIso(row.closeDate)),
    },
  ];
  return (
    <>
      <Toolbar
        tr={tr}
        query={query}
        onQuery={setQuery}
        filter={
          <Select
            label={tr("demo.apps.crm.col.stage")}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            placeholder={tr("demo.apps.crm.all")}
          >
            {DEAL_STAGES.map((key) => (
              <option key={key} value={key}>
                {tr(DEAL_STAGE_KEYS[key])}
              </option>
            ))}
          </Select>
        }
      />
      <DataTable
        caption={tr("demo.apps.crm.tab.deals")}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        {...tableProps(tr)}
      />
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function DetailBody({
  detail,
  tr,
  locale,
  onOpen,
}: {
  detail: Detail;
  tr: Tr;
  locale: Locale;
  onOpen: (kind: Detail["kind"], id: string, element: HTMLElement) => void;
}) {
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
  const dealList = (deals: readonly CrmDeal[]) =>
    deals.length === 0 ? (
      <p>{tr("demo.apps.crm.no_deals")}</p>
    ) : (
      <ul className="crm-detail__deals">
        {deals.map((deal) => (
          <li key={deal.id}>
            <LinkButton onOpen={(el) => onOpen("deal", deal.id, el)}>{deal.title}</LinkButton>
            <span>{formatEuro(deal.amount)}</span>
            <StatusPill tone={DEAL_TONES[deal.stage]}>{tr(DEAL_STAGE_KEYS[deal.stage])}</StatusPill>
          </li>
        ))}
      </ul>
    );

  if (detail.kind === "company") {
    const entry = company(detail.id);
    if (!entry) return null;
    return (
      <div className="crm-detail">
        <p>
          <StatusPill tone={STATUS_TONES[entry.status]}>{tr(STATUS_KEYS[entry.status])}</StatusPill>
        </p>
        <dl className="crm-detail__facts">
          <Fact label={tr("demo.apps.crm.col.sector")}>{entry.sector}</Fact>
          <Fact label={tr("demo.apps.crm.col.city")}>{entry.city}</Fact>
          <Fact label={tr("demo.apps.crm.col.owner")}>{entry.owner}</Fact>
          <Fact label={tr("demo.apps.crm.col.vacancies")}>{entry.vacancies}</Fact>
          <Fact label={tr("demo.apps.crm.col.website")}>{entry.website}</Fact>
        </dl>
        <h3>{tr("demo.apps.crm.tab.contacts")}</h3>
        <ul className="crm-detail__deals">
          {entry.contactIds.map((id) => {
            const person = contact(id);
            return person ? (
              <li key={id}>
                <LinkButton onOpen={(el) => onOpen("contact", id, el)}>{person.name}</LinkButton>
                <span>{person.function}</span>
              </li>
            ) : null;
          })}
        </ul>
        <h3>{tr("demo.apps.crm.tab.deals")}</h3>
        {dealList(CRM_DEALS.filter((deal) => deal.companyId === entry.id))}
      </div>
    );
  }
  if (detail.kind === "contact") {
    const entry = contact(detail.id);
    if (!entry) return null;
    return (
      <div className="crm-detail">
        <p className="crm__person">
          <Avatar name={entry.name} size="lg" />
          <span>{entry.function}</span>
        </p>
        <dl className="crm-detail__facts">
          <Fact label={tr("demo.apps.crm.col.company")}>
            <LinkButton onOpen={(el) => onOpen("company", entry.companyId, el)}>
              {company(entry.companyId)?.name}
            </LinkButton>
          </Fact>
          <Fact label={tr("demo.apps.crm.col.email")}>
            <a href={`mailto:${entry.email}`}>{entry.email}</a>
          </Fact>
          <Fact label={tr("demo.apps.crm.col.phone")}>{entry.phone}</Fact>
        </dl>
        <h3>{tr("demo.apps.crm.tab.deals")}</h3>
        {dealList(CRM_DEALS.filter((deal) => deal.contactId === entry.id))}
      </div>
    );
  }
  const entry = CRM_DEALS.find((deal) => deal.id === detail.id);
  if (!entry) return null;
  return (
    <div className="crm-detail">
      <p>
        <StatusPill tone={DEAL_TONES[entry.stage]}>{tr(DEAL_STAGE_KEYS[entry.stage])}</StatusPill>
      </p>
      <dl className="crm-detail__facts">
        <Fact label={tr("demo.apps.crm.col.amount")}>{formatEuro(entry.amount)}</Fact>
        <Fact label={tr("demo.apps.crm.col.close_date")}>{date.format(fromIso(entry.closeDate))}</Fact>
        <Fact label={tr("demo.apps.crm.col.company")}>
          <LinkButton onOpen={(el) => onOpen("company", entry.companyId, el)}>
            {company(entry.companyId)?.name}
          </LinkButton>
        </Fact>
        <Fact label={tr("demo.apps.crm.contact")}>
          <LinkButton onOpen={(el) => onOpen("contact", entry.contactId, el)}>
            {contact(entry.contactId)?.name}
          </LinkButton>
        </Fact>
        <Fact label={tr("demo.apps.crm.col.owner")}>{entry.owner}</Fact>
      </dl>
    </div>
  );
}
