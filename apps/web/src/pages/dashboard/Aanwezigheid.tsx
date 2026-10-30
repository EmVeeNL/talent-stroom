import { useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Button } from "@talentstroom/ui";
import { lateRows, leaveRows } from "../../demo/dashboards-b.ts";
import { DashboardPage, label } from "./widgets-b/DashboardPage.tsx";
import { DashboardGrid, Kpis, Panel, SimpleTable, Status } from "./widgets-b/DashboardWidgets.tsx";
export default function AanwezigheidPage({ locale }: { locale: Locale }) {
  const l = (k: string) => label(locale, `attendance.${k}`);
  const [decisions, setDecisions] = useState<Record<string, "approved" | "denied">>({});
  const days = l("days").split(","),
    dates = l("weekDates").split(",");
  const people = ["Mila de Boer", "Sem Bakker", "Noor Dekker", "Lars Meijer", "Fenna Visser"];
  const values = [
    [3, 3, 3, 2, 1],
    [3, 2, 3, 3, 3],
    [2, 3, 3, 3, 2],
    [3, 3, 1, 3, 3],
    [1, 3, 2, 3, 3],
  ];
  return (
    <DashboardPage locale={locale} area="attendance" title={t(locale, "nav.dashboard.aanwezigheid")}>
      <Kpis
        locale={locale}
        items={[
          { label: l("present"), value: 31, icon: "group", tone: "success" },
          { label: l("absent"), value: 3, icon: "person", tone: "accent" },
          { label: l("remote"), value: 8, icon: "event", tone: "primary" },
        ]}
      />
      <DashboardGrid>
        <Panel title={l("week")} className="demo-b-panel--wide">
          <section className="demo-b-calendar-wrap" aria-label={l("week")}>
            <table className="demo-b-calendar">
              <caption className="demo-b-muted">{l("week")} · 26–30 oktober 2026</caption>
              <thead>
                <tr>
                  <th scope="col">{l("person")}</th>
                  {days.map((day, i) => (
                    <th scope="col" key={day}>
                      {day} {dates[i]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map((person, row) => (
                  <tr key={person}>
                    <th scope="row">{person}</th>
                    {values[row]?.map((level, i) => (
                      <td
                        key={`${person}-${days[i]}`}
                        data-level={level}
                        aria-label={`${days[i]}: ${level === 3 ? l("presentLabel") : level === 2 ? l("remoteLabel") : l("absentLabel")}`}
                      >
                        {level === 3 ? l("presentLabel") : level === 2 ? l("remoteLabel") : l("absentLabel")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <div className="demo-b-calendar-legend" aria-label={l("legend")}>
            {[
              { level: 3, label: l("presentLabel") },
              { level: 2, label: l("remoteLabel") },
              { level: 1, label: l("absentLabel") },
            ].map(({ level, label: statusLabel }) => (
              <span key={level}>
                <i data-level={level} aria-hidden="true" />
                {statusLabel}
              </span>
            ))}
          </div>
        </Panel>
        <Panel title={l("leave")}>
          <SimpleTable
            label={l("leave")}
            columns={[l("person"), l("reason"), l("status")]}
            rows={leaveRows.map((request) => {
              const state = decisions[request.name];
              return [
                request.name,
                `${l(request.reason)} · ${request.dates}`,
                state ? (
                  <Status key={`${request.name}-decision`} tone={state === "approved" ? "success" : "danger"}>
                    {l(state)}
                  </Status>
                ) : (
                  <span key={`${request.name}-actions`} className="demo-b-actions">
                    <Button size="sm" onClick={() => setDecisions({ ...decisions, [request.name]: "approved" })}>
                      {l("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setDecisions({ ...decisions, [request.name]: "denied" })}
                    >
                      {l("deny")}
                    </Button>
                  </span>
                ),
              ];
            })}
          />
        </Panel>
        <Panel title={l("late")}>
          <SimpleTable
            label={l("late")}
            columns={[l("person"), l("time"), l("reason")]}
            rows={lateRows.map((row) => [row.name, row.time, row.reason])}
          />
        </Panel>
      </DashboardGrid>
    </DashboardPage>
  );
}
