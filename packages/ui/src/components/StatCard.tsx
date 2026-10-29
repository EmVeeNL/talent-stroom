import type { IconName } from "../icons.ts";
import { Card } from "./Card.tsx";
import { Icon } from "./Icon.tsx";
import { TrendIndicator, trendText } from "./TrendIndicator.tsx";
import type { TrendIndicatorProps } from "./TrendIndicator.tsx";
import type { ReactNode } from "react";
export interface StatCardProps {
  label: string;
  value: number;
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  icon?: IconName;
  trend?: TrendIndicatorProps;
  description?: string;
  badge?: ReactNode;
}
export function StatCard({
  label,
  value,
  locale = "nl-NL",
  formatOptions,
  icon,
  trend,
  description,
  badge,
}: StatCardProps) {
  const formatted = new Intl.NumberFormat(locale, formatOptions).format(value);
  return (
    <Card className="ts-stat-card">
      <p className="ts-visually-hidden">
        {[label, formatted, trend ? trendText(trend) : undefined, description].filter(Boolean).join(". ")}
      </p>
      <div aria-hidden="true" className="ts-stat-card__content">
        <span className="ts-stat-card__label">
          {label}
          {icon && <Icon name={icon} />}
        </span>
        <strong className="ts-stat-card__value">{formatted}</strong>
        {trend && <TrendIndicator {...trend} />}
        {description && <span className="ts-stat-card__description">{description}</span>}
      </div>
      {badge}
    </Card>
  );
}
