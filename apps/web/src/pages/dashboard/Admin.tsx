import { Breadcrumb } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Bars, DashboardBreadcrumbs, Frame, Panel, Stats, tr } from "./widgets/DashboardWidgets.tsx";
export default function AdminPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.dashboard.admin");
  return (
    <>
      <Frame
        breadcrumbs={
          <DashboardBreadcrumbs locale={locale}>
            <Breadcrumb
              label={t(locale, "nav.breadcrumbs")}
              items={[{ label: t(locale, "nav.group.dashboard") }, { label: title }]}
            />
          </DashboardBreadcrumbs>
        }
        title={tr(locale, "demo.dashboard.admin-title")}
        subtitle={tr(locale, "demo.dashboard.admin-subtitle")}
      >
        <Stats
          locale={locale}
          items={[
            { label: tr(locale, "demo.dashboard.seats"), value: 8, icon: "group", trend: 0 },
            { label: tr(locale, "demo.dashboard.active-recruiters"), value: 6, icon: "business", trend: 8 },
            { label: tr(locale, "demo.dashboard.storage"), value: 68, icon: "work", trend: 12, tone: "violet" },
            { label: tr(locale, "demo.dashboard.audit-events"), value: 124, icon: "shield", trend: 4, tone: "success" },
          ]}
        />
        <div className="demo-dashboard__grid">
          <Bars
            locale={locale}
            title={tr(locale, "demo.dashboard.plan-usage")}
            items={[
              { label: tr(locale, "demo.dashboard.seats"), value: 80 },
              { label: tr(locale, "demo.dashboard.storage"), value: 68 },
              { label: tr(locale, "demo.dashboard.monthly-actions"), value: 42 },
            ]}
          />
          <Panel title={tr(locale, "demo.dashboard.system-status")}>
            <ul className="demo-task-list">
              {(
                ["demo.dashboard.api-status", "demo.dashboard.database-status", "demo.dashboard.mail-status"] as const
              ).map((k) => (
                <li key={k}>
                  <span>{tr(locale, k)}</span>
                  <span className="demo-good">● {tr(locale, "demo.dashboard.operational")}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={tr(locale, "demo.dashboard.audit-log")}>
            <div className="demo-audit">
              <div>
                <b>{tr(locale, "demo.dashboard.audit-user")}</b>
                <b>{tr(locale, "demo.dashboard.audit-action")}</b>
                <b>{tr(locale, "demo.dashboard.audit-time")}</b>
              </div>
              {[
                ["Mila Vermeer", "Gebruiker uitgenodigd", "10:42"],
                ["Noor Bakker", "Instellingen bijgewerkt", "09:18"],
                ["Joris Dekker", "Rapportage bekeken", "Gisteren"],
              ].map((r) => (
                <div key={r[0]}>
                  {r.map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Frame>
    </>
  );
}
