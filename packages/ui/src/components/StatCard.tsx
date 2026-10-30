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
  tone?: "primary" | "success" | "violet" | "accent";
  sparkline?: { values: readonly number[]; label: string };
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
  tone = "primary",
  sparkline,
}: StatCardProps) {
  const formatted = new Intl.NumberFormat(locale, formatOptions).format(value);
  const values = sparkline?.values ?? [];
  const valid = values.length > 1 && values.every(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = valid
    ? values
        .map(
          (point, index) =>
            `${2 + (index / (values.length - 1)) * 76},${max === min ? 18 : 34 - ((point - min) / (max - min)) * 32}`,
        )
        .join(" ")
    : "";
  return (
    <Card variant="kpi" className={`ts-stat-card ts-stat-card--${tone}`}>
      <p className="ts-visually-hidden">
        {[label, formatted, trend ? trendText(trend) : undefined, description].filter(Boolean).join(". ")}
      </p>
      <div className="ts-stat-card__layout">
        {icon && (
          <span aria-hidden="true" className="ts-stat-card__icon">
            <Icon name={icon} size={24} />
          </span>
        )}
        <div aria-hidden="true" className="ts-stat-card__content">
          <span className="ts-stat-card__label">{label}</span>
          <strong className="ts-stat-card__value">{formatted}</strong>
          {trend && (
            <span className="ts-stat-card__trend">
              <TrendIndicator {...trend} compact />
              <span className="ts-stat-card__description">{trend.comparisonLabel}</span>
            </span>
          )}
          {description && <span className="ts-stat-card__description">{description}</span>}
        </div>
        {valid && sparkline && (
          <svg className="ts-stat-card__sparkline" viewBox="0 0 80 36" role="img" aria-label={sparkline.label}>
            <polyline
              points={points}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
      {badge}
    </Card>
  );
}
