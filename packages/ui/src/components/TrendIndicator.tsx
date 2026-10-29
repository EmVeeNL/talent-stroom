import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
export interface TrendIndicatorProps {
  value: number;
  comparisonLabel: string;
  upIsGood?: boolean;
  locale?: string;
  className?: string;
}
export function trendText({ value, comparisonLabel, locale = "nl-NL" }: TrendIndicatorProps) {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(value)}% ${comparisonLabel}`;
}
export function TrendIndicator({ upIsGood = true, className, ...props }: TrendIndicatorProps) {
  const tone = props.value === 0 ? "neutral" : props.value > 0 === upIsGood ? "success" : "danger";
  return (
    <span className={cx("ts-trend", `ts-trend--${tone}`, className)}>
      <Icon name={props.value > 0 ? "trending_up" : props.value < 0 ? "trending_down" : "trending_flat"} size={20} />
      <span>{trendText(props)}</span>
    </span>
  );
}
