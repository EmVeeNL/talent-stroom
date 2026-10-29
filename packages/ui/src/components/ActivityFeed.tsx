import { useEffect, useState } from "react";
import { Avatar } from "./Avatar.tsx";
export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  date: Date;
  avatar?: string;
}
export interface ActivityFeedProps {
  label: string;
  items: ActivityItem[];
  now?: Date;
  locale?: string;
}
function relative(date: Date, now: Date, locale: string) {
  const seconds = (date.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(seconds);
  const [unit, divisor]: [Intl.RelativeTimeFormatUnit, number] =
    abs < 60
      ? ["second", 1]
      : abs < 3600
        ? ["minute", 60]
        : abs < 86400
          ? ["hour", 3600]
          : abs < 604800
            ? ["day", 86400]
            : abs < 2629800
              ? ["week", 604800]
              : abs < 31557600
                ? ["month", 2629800]
                : ["year", 31557600];
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(seconds / divisor), unit);
}
export function ActivityFeed({ label, items, now, locale = "nl" }: ActivityFeedProps) {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    if (now) return undefined;
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, [now]);
  return (
    <div role="region" aria-label={label} tabIndex={0} className="ts-activity-feed">
      <ol>
        {[...items]
          .toSorted((a, b) => b.date.getTime() - a.date.getTime())
          .map((item) => (
            <li key={item.id}>
              <Avatar name={item.actor} {...(item.avatar ? { src: item.avatar } : {})} size="sm" />
              <div>
                <p>
                  <strong>{item.actor}</strong> {item.action}
                </p>
                <time
                  dateTime={item.date.toISOString()}
                  title={new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(item.date)}
                >
                  {relative(item.date, now ?? clock, locale)}
                </time>
              </div>
            </li>
          ))}
      </ol>
    </div>
  );
}
