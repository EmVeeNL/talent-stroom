import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Badge } from "@talentstroom/ui";
import { payslipRows } from "../../demo/dashboards-b.ts";
import { DashboardPage, label, money } from "./widgets-b/DashboardPage.tsx";
import { Bars, DashboardGrid, Kpis, Panel, SimpleTable } from "./widgets-b/DashboardWidgets.tsx";
export default function SalarisadministratiePage({ locale }: { locale: Locale }) {
  const l = (k: string) => label(locale, `payroll.${k}`);
  return (
    <DashboardPage locale={locale} area="payroll" title={t(locale, "nav.dashboard.salarisadministratie")}>
      <DashboardGrid>
        <Panel title={l("run")} className="demo-b-panel--wide">
          <div className="demo-b-run">
            <div>
              <strong>{l("run")}</strong>
              <p className="demo-b-muted">
                {l("periodValue")} · {l("employeeCount")}
              </p>
            </div>
            <Badge tone="success" variant="solid">
              {l("ready")}
            </Badge>
          </div>
        </Panel>
      </DashboardGrid>
      <Kpis
        locale={locale}
        items={[
          {
            label: l("gross"),
            value: 84200,
            icon: "euro",
            format: { style: "currency", currency: "EUR", maximumFractionDigits: 0 },
            tone: "primary",
          },
          {
            label: l("net"),
            value: 56800,
            icon: "payments",
            format: { style: "currency", currency: "EUR", maximumFractionDigits: 0 },
            tone: "success",
          },
        ]}
      />
      <DashboardGrid>
        <Panel title={l("costs")}>
          <Bars
            title={l("costs")}
            categories={[l("recruitment"), l("operations"), l("finance")]}
            values={[43200, 23100, 17900]}
            locale={locale}
          />
        </Panel>
        <Panel title={l("payments")}>
          <ul>
            <li>
              {l("date1")} · {money(56800)}
            </li>
            <li>
              {l("date2")} · {money(57120)}
            </li>
            <li>
              {l("date3")} · {money(57400)}
            </li>
          </ul>
        </Panel>
        <Panel title={l("payslips")} className="demo-b-panel--wide">
          <SimpleTable
            label={l("payslips")}
            columns={[l("employee"), l("department"), l("iban"), l("period"), l("amount")]}
            rows={payslipRows.map((row) => [row.name, row.department, row.iban, l("periodValue"), money(row.net)])}
          />
        </Panel>
      </DashboardGrid>
    </DashboardPage>
  );
}
