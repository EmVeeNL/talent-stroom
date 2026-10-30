import { ActivityFeed, Avatar, Breadcrumb, Card, PageHeader, StatusPill } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import "./data-pages.css";

const today = new Date("2026-10-30T12:00:00Z");

export default function LijstenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.data.lijsten");
  const actions = [
    {
      id: "1",
      actor: "Sanne Willems",
      action: t(locale, "demo.data.tables.action1"),
      date: new Date("2026-10-30T11:50:00Z"),
    },
    {
      id: "2",
      actor: "Joris van den Berg",
      action: t(locale, "demo.data.tables.action2"),
      date: new Date("2026-10-30T09:20:00Z"),
    },
    {
      id: "3",
      actor: "Fatima El Amrani",
      action: t(locale, "demo.data.tables.action3"),
      date: new Date("2026-10-29T14:10:00Z"),
    },
    {
      id: "4",
      actor: "Lotte Hendriks",
      action: t(locale, "demo.data.tables.action1"),
      date: new Date("2026-10-28T10:30:00Z"),
    },
  ];
  const groups = [
    {
      heading: t(locale, "demo.data.data.status.new"),
      tone: "info" as const,
      people: [
        ["Sanne Willems", "Frontend Developer", "Amsterdam"],
        ["Joris van den Berg", "Backend Developer", "Utrecht"],
      ],
    },
    {
      heading: t(locale, "demo.data.data.status.active"),
      tone: "warning" as const,
      people: [
        ["Fatima El Amrani", "Product Designer", "Rotterdam"],
        ["Daan Visser", "DevOps Engineer", "Den Haag"],
      ],
    },
    {
      heading: t(locale, "demo.data.data.status.placed"),
      tone: "success" as const,
      people: [["Lotte Hendriks", "Data Engineer", "Utrecht"]],
    },
  ];
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.data") }, { label: title }]}
      />
      <PageHeader title={title} />
      <div className="data-list-grid">
        <Card as="section" title={t(locale, "demo.data.tables.candidates")}>
          <div className="data-list-groups">
            {groups.map((group) => (
              <section key={group.heading} className="data-list-group" aria-label={group.heading}>
                <div className="data-list-group__heading">
                  <h3>{group.heading}</h3>
                  <StatusPill tone={group.tone}>{group.people.length}</StatusPill>
                </div>
                <ul>
                  {group.people.map(([name, role, city]) => (
                    <li key={name}>
                      <Avatar name={name ?? ""} size="sm" />
                      <div>
                        <strong>{name}</strong>
                        <span>
                          {role} · {city}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>
        <Card as="section" title={t(locale, "demo.data.tables.activity")}>
          <ActivityFeed label={t(locale, "demo.data.tables.activity")} items={actions} now={today} locale={locale} />
        </Card>
        <Card as="section" title={t(locale, "demo.data.tables.activity")} className="data-list-timeline">
          <ol className="data-timeline">
            {actions.map((item) => (
              <li key={item.id}>
                <span className="data-timeline__marker" aria-hidden="true" />
                <time dateTime={item.date.toISOString()}>
                  {new Intl.DateTimeFormat(locale, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Amsterdam",
                  }).format(item.date)}
                </time>
                <p>
                  <strong>{item.actor}</strong> {item.action}
                </p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
