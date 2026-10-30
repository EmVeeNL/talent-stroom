import { Breadcrumb } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import {
  Activity,
  Bars,
  DashboardBreadcrumbs,
  Frame,
  Panel,
  Stats,
  TaskList,
  tr,
} from "./widgets/DashboardWidgets.tsx";
export default function MedewerkerPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.dashboard.medewerker");
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
        title={tr(locale, "demo.dashboard.employee-greeting")}
        subtitle={tr(locale, "demo.dashboard.employee-subtitle")}
      >
        <Stats
          locale={locale}
          items={[
            { label: tr(locale, "demo.dashboard.my-candidates"), value: 18, icon: "group", trend: 12 },
            { label: tr(locale, "demo.dashboard.my-tasks"), value: 5, icon: "task_alt", trend: 4, tone: "success" },
            { label: tr(locale, "demo.dashboard.my-meetings"), value: 3, icon: "event", trend: 8, tone: "violet" },
            {
              label: tr(locale, "demo.dashboard.target-month"),
              value: 7,
              icon: "work_history",
              trend: 14,
              tone: "accent",
            },
          ]}
        />
        <div className="demo-dashboard__grid">
          <TaskList locale={locale} />
          <Panel title={tr(locale, "demo.dashboard.agenda-today")}>
            <ul className="demo-task-list">
              {[
                "10:00 · Intake met Lisa Jansen",
                "13:30 · Voorbereiding klantgesprek",
                "15:00 · Weekcheck met team",
              ].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Panel>
          <Bars
            locale={locale}
            title={tr(locale, "demo.dashboard.personal-targets")}
            items={[
              { label: tr(locale, "demo.dashboard.placements"), value: 70 },
              { label: tr(locale, "demo.dashboard.interviews"), value: 82 },
              { label: tr(locale, "demo.dashboard.outreach"), value: 56 },
            ]}
          />
          <Panel title={tr(locale, "demo.dashboard.my-candidates")}>
            <ul className="demo-task-list">
              {[
                "Sanne de Groot · Product Designer",
                "Tom van Dijk · Backend Developer",
                "Eva Willems · Customer Success",
              ].map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Panel>
          <Activity locale={locale} />
          <Panel title={tr(locale, "demo.dashboard.messages")}>
            <ul className="demo-task-list">
              <li>
                Mila Vermeer <span>{tr(locale, "demo.dashboard.message-one")}</span>
              </li>
              <li>
                Joris Dekker <span>{tr(locale, "demo.dashboard.message-two")}</span>
              </li>
            </ul>
          </Panel>
        </div>
      </Frame>
    </>
  );
}
