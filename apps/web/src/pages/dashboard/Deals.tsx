import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Badge } from "@talentstroom/ui";
import { dealRows } from "../../demo/dashboards-b.ts";
import { DashboardPage, label, money } from "./widgets-b/DashboardPage.tsx";
import { Bars, DashboardGrid, Kpis, Panel, SimpleTable, Trend } from "./widgets-b/DashboardWidgets.tsx";
export default function DealsPage({ locale }: { locale: Locale }) {
  const l = (k: string) => label(locale, `deals.${k}`);
  return (
    <DashboardPage locale={locale} area="deals" title={t(locale, "nav.dashboard.deals")}>
      <Kpis
        locale={locale}
        items={[
          {
            label: l("pipeline"),
            value: 139300,
            icon: "euro",
            format: { style: "currency", currency: "EUR", maximumFractionDigits: 0 },
            tone: "primary",
          },
          { label: l("won"), value: 12, icon: "handshake", tone: "success", description: l("wonLabel") },
          {
            label: l("winrate"),
            value: 0.68,
            icon: "group",
            format: { style: "percent" },
            tone: "violet",
            description: "+6%",
          },
          {
            label: l("forecast"),
            value: 94600,
            icon: "payments",
            format: { style: "currency", currency: "EUR", maximumFractionDigits: 0 },
            tone: "accent",
          },
        ]}
      />
      <DashboardGrid>
        <Panel title={l("stages")}>
          <Bars
            title={l("stages")}
            categories={[l("open"), l("proposal"), l("negotiation"), l("wonLabel")]}
            values={[8, 5, 4, 12]}
            locale={locale}
          />
        </Panel>
        <Panel title={l("trend")}>
          <Trend
            title={l("wonLabel")}
            secondaryTitle={l("lostLabel")}
            secondaryValues={[4, 3, 5, 4, 3, 2]}
            categories={l("months").split(",")}
            values={[5, 7, 6, 9, 8, 12]}
            locale={locale}
          />
        </Panel>
      </DashboardGrid>
      <div className="demo-b-deals-bottom">
        <Panel title={l("top")}>
          <SimpleTable
            label={l("top")}
            columns={[l("company"), l("name"), l("stage"), l("value"), l("close")]}
            rows={dealRows.map((d) => [
              d.company,
              d.name,
              <Badge key={d.name} tone={d.stage === "negotiation" ? "warning" : "info"} variant="subtle">
                {l(d.stage)}
              </Badge>,
              money(d.value),
              d.close,
            ])}
          />
        </Panel>
        <Panel title={l("forecast")}>
          <strong style={{ fontSize: 24 }}>{money(94600)}</strong>
          <p className="demo-b-muted">{l("forecastNote")}</p>
          <div className="demo-b-progress">
            <span style={{ width: "68%" }} />
          </div>
          <p>{l("forecastRate")}</p>
        </Panel>
      </div>
    </DashboardPage>
  );
}
