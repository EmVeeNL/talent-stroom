import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Badge } from "@talentstroom/ui";
import { leadRows } from "../../demo/dashboards-b.ts";
import { DashboardPage, label } from "./widgets-b/DashboardPage.tsx";
import { DashboardGrid, Donut, Kpis, Panel, SimpleTable } from "./widgets-b/DashboardWidgets.tsx";
export default function LeadsPage({ locale }: { locale: Locale }) {
  const l = (k: string) => label(locale, `leads.${k}`);
  const stages = l("steps").split(",");
  return (
    <DashboardPage locale={locale} area="leads" title={t(locale, "nav.dashboard.leads")}>
      <Kpis
        locale={locale}
        items={[
          { label: l("new"), value: 38, icon: "person", tone: "primary" },
          { label: l("followups"), value: 7, icon: "event", tone: "accent" },
          { label: l("qualified"), value: 14, icon: "group", tone: "success" },
          { label: l("customer"), value: 6, icon: "handshake", tone: "violet" },
        ]}
      />
      <DashboardGrid>
        <Panel title={l("sources")}>
          <Donut
            title={l("sources")}
            locale={locale}
            data={[
              { id: "web", label: l("web"), value: 42 },
              { id: "ref", label: l("referral"), value: 28 },
              { id: "event", label: l("event"), value: 18 },
              { id: "campaign", label: l("campaign"), value: 12 },
            ]}
          />
        </Panel>
        <Panel title={l("funnel")}>
          <div className="demo-b-funnel">
            {stages.map((stage, i) => {
              const value = [38, 27, 14, 6][i] ?? 0;
              return (
                <div className="demo-b-funnel-row" key={stage}>
                  <span>{stage}</span>
                  <div className="demo-b-progress">
                    <span style={{ width: `${Math.round((value / 38) * 100)}%` }} />
                  </div>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel title={l("new")} className="demo-b-panel--wide">
          <SimpleTable
            label={l("new")}
            columns={[l("name"), l("company"), l("source"), l("status"), l("score"), l("owner"), l("due")]}
            rows={leadRows.map((lead) => [
              lead.name,
              lead.company,
              l(lead.source),
              <Badge
                key={`${lead.name}-status`}
                tone={lead.status === "qualified" ? "success" : "info"}
                variant="subtle"
              >
                {l(lead.status)}
              </Badge>,
              <Badge key={`${lead.name}-score`} tone={lead.score >= 80 ? "success" : "warning"} variant="solid">
                {lead.score}
              </Badge>,
              lead.owner,
              l(lead.due),
            ])}
          />
        </Panel>
        <Panel title={l("followups")}>
          <ul>
            {leadRows
              .filter((lead) => lead.due === "today")
              .map((lead) => (
                <li key={lead.name}>
                  {lead.name} · {lead.company}
                </li>
              ))}
          </ul>
        </Panel>
      </DashboardGrid>
    </DashboardPage>
  );
}
