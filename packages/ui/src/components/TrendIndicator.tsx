import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
export interface TrendIndicatorProps {
  value: number;
  compact?: boolean;
  comparisonLabel: string;
  upIsGood?: boolean;
  locale?: string;
  className?: string;
}
export function trendText({ value, comparisonLabel, locale = "nl-NL" }: TrendIndicatorProps) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(value)}% ${comparisonLabel}`;
}
export function TrendIndicator({ upIsGood = true, className, compact = false, ...props }: TrendIndicatorProps) {
  const tone = props.value === 0 ? "neutral" : props.value > 0 === upIsGood ? "success" : "danger";
  return (
    <span className={cx("ts-trend", `ts-trend--${tone}`, compact && "ts-trend--compact", className)}>
      <Icon name={props.value > 0 ? "arrow_upward" : props.value < 0 ? "arrow_downward" : "trending_flat"} size={20} />
      <span>{compact ? trendText({ ...props, comparisonLabel: "" }).trim() : trendText(props)}</span>
    </span>
  );
}
