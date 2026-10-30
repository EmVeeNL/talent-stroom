import type { IconName } from "../icons.ts";
import { Card } from "./Card.tsx";
import { Icon } from "./Icon.tsx";
import { TrendIndicator, trendText } from "./TrendIndicator.tsx";
import type { TrendIndicatorProps } from "./TrendIndicator.tsx";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "../motion/index.ts";
import { motionDurations, motionEasings } from "../tokens.ts";
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
  const root = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLSpanElement>(null);
  const finalNumber = useRef<HTMLSpanElement>(null);
  const line = useRef<SVGPolylineElement>(null);
  const played = useRef(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const element = root.current;
    const display = number.current;
    const final = finalNumber.current;
    if (!element || !display || !final) return undefined;
    // Changes to data or preferences cancel the first-view effect; they never replay it.
    if (played.current || reducedMotion || typeof IntersectionObserver === "undefined") {
      played.current ||= reducedMotion || typeof IntersectionObserver === "undefined";
      return undefined;
    }
    const formatter = new Intl.NumberFormat(locale, formatOptions);
    const fractionDigits = formatter.formatToParts(value).find((part) => part.type === "fraction")?.value.length ?? 0;
    const precision = 10 ** (fractionDigits + (formatOptions?.style === "percent" ? 2 : 0));
    const transition = { duration: motionDurations.slow / 1000, ease: motionEasings.standard };
    let cancel = () => {};
    const observer = new IntersectionObserver((entries) => {
      if (played.current || !entries.some((entry) => entry.isIntersecting)) return;
      played.current = true;
      observer.disconnect();
      // The final span reserves the formatted value's width and remains DOM text.
      final.style.visibility = "hidden";
      const count = animate(0, value, {
        ...transition,
        onUpdate: (current) => {
          display.textContent = formatter.format(Math.round(current * precision) / precision);
        },
        onComplete: () => {
          final.style.visibility = "";
          display.textContent = "";
        },
      });
      const path = line.current;
      const drawing = path ? animate(path, { pathLength: [0, 1] }, transition) : undefined;
      cancel = () => {
        count.stop();
        drawing?.stop();
        final.style.visibility = "";
        display.textContent = "";
        path?.removeAttribute("stroke-dasharray");
        path?.removeAttribute("stroke-dashoffset");
      };
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancel();
    };
  }, [value, locale, formatOptions, reducedMotion]);
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
      <div ref={root} className="ts-stat-card__layout">
        {icon && (
          <span aria-hidden="true" className="ts-stat-card__icon">
            <Icon name={icon} size={24} />
          </span>
        )}
        <div aria-hidden="true" className="ts-stat-card__content">
          <span className="ts-stat-card__label">{label}</span>
          <strong className="ts-stat-card__value">
            <span ref={finalNumber}>{formatted}</span>
            <span ref={number} className="ts-stat-card__count" />
          </strong>
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
              ref={line}
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
