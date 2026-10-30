import { Breadcrumb } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Bars, DashboardBreadcrumbs, Frame, Panel, Stats, tr } from "./widgets/DashboardWidgets.tsx";
export default function HRPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.dashboard.hr");
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
        title={tr(locale, "demo.dashboard.hr-title")}
        subtitle={tr(locale, "demo.dashboard.hr-subtitle")}
      >
        <Stats
          locale={locale}
          items={[
            { label: tr(locale, "demo.dashboard.headcount"), value: 84, icon: "group", trend: 6 },
            { label: tr(locale, "demo.dashboard.absence"), value: 4, icon: "event", trend: 2, tone: "violet" },
            { label: tr(locale, "demo.dashboard.leave-requests"), value: 7, icon: "work", trend: 10, tone: "success" },
            { label: tr(locale, "demo.dashboard.onboarding"), value: 9, icon: "task_alt", trend: 3, tone: "accent" },
          ]}
        />
        <div className="demo-dashboard__grid">
          <Bars
            locale={locale}
            title={tr(locale, "demo.dashboard.leave-chart")}
            items={[
              { label: tr(locale, "demo.dashboard.january"), value: 22 },
              { label: tr(locale, "demo.dashboard.february"), value: 35 },
              { label: tr(locale, "demo.dashboard.march"), value: 28 },
              { label: tr(locale, "demo.dashboard.april"), value: 42 },
            ]}
          />
          <Panel title={tr(locale, "demo.dashboard.upcoming-dates")}>
            <ul className="demo-task-list">
              {[
                "Mila Vermeer · verjaardag · 2 nov",
                "Joris Dekker · jubileum · 5 nov",
                "Eva Willems · verjaardag · 9 nov",
              ].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Panel>
          <Panel title={tr(locale, "demo.dashboard.onboarding-tasks")}>
            <ul className="demo-task-list">
              {["Laptop klaarzetten · 2 open", "Introductie plannen · 4 open", "Contract controleren · 3 open"].map(
                (x) => (
                  <li key={x}>{x}</li>
                ),
              )}
            </ul>
          </Panel>
          <Panel title={tr(locale, "demo.dashboard.departments")}>
            <div className="demo-audit">
              <div>
                <b>{tr(locale, "demo.dashboard.department")}</b>
                <b>{tr(locale, "demo.dashboard.people")}</b>
                <b>{tr(locale, "demo.dashboard.absence-rate")}</b>
              </div>
              {[
                ["Recruitment", "32", "3%"],
                ["Sales", "18", "4%"],
                ["Operations", "14", "2%"],
                ["Technologie", "20", "5%"],
              ].map((r) => (
                <div key={r[0]}>
                  {r.map((x) => (
                    <span key={x}>{x}</span>
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
