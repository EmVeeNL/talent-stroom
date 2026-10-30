import { useState } from "react";
import { Breadcrumb, Button } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import {
  Activity,
  Bars,
  Candidates,
  DashboardBreadcrumbs,
  Frame,
  Pipeline,
  Stats,
  TaskList,
  tr,
} from "./widgets/DashboardWidgets.tsx";
export default function RecruitmentPage({ locale }: { locale: Locale }) {
  const [candidateAdded, setCandidateAdded] = useState(false);
  const title = t(locale, "nav.dashboard.recruitment");
  return (
    <>
      <Frame
        breadcrumbs={
          <DashboardBreadcrumbs locale={locale}>
            <Breadcrumb
              label={t(locale, "nav.breadcrumbs")}
              items={[{ label: t(locale, "nav.group.dashboard"), href: "/" }, { label: title }]}
            />
          </DashboardBreadcrumbs>
        }
        title={tr(locale, "demo.dashboard.greeting")}
        subtitle={tr(locale, "demo.dashboard.recruitment-subtitle")}
        actions={<Button onClick={() => setCandidateAdded(true)}>{tr(locale, "demo.dashboard.new-candidate")}</Button>}
      >
        <Stats
          locale={locale}
          items={[
            { label: tr(locale, "demo.dashboard.candidates"), value: 1248, icon: "group", trend: 12 },
            { label: tr(locale, "demo.dashboard.vacancies"), value: 86, icon: "work", trend: 8, tone: "success" },
            {
              label: tr(locale, "demo.dashboard.placements"),
              value: 34,
              icon: "work_history",
              trend: 21,
              tone: "violet",
            },
            { label: tr(locale, "demo.dashboard.clients"), value: 48, icon: "handshake", trend: 5, tone: "accent" },
          ]}
        />
        <Pipeline locale={locale} />
        {candidateAdded && (
          <output className="demo-dashboard__toast">{tr(locale, "demo.dashboard.candidate-added")}</output>
        )}
        <div className="demo-dashboard__grid">
          <Candidates locale={locale} />
          <TaskList locale={locale} />
          <Activity locale={locale} />
          <Bars
            locale={locale}
            title={tr(locale, "demo.dashboard.vacancy-status")}
            items={[
              { label: tr(locale, "demo.dashboard.open"), value: 72 },
              { label: tr(locale, "demo.dashboard.progress"), value: 48 },
              { label: tr(locale, "demo.dashboard.closed"), value: 26 },
            ]}
          />
        </div>
      </Frame>
    </>
  );
}
