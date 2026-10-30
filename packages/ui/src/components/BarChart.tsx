import { lazy, Suspense } from "react";
import { ChartTable } from "./chart.tsx";
import type { CartesianChartProps } from "./chart.tsx";
const TanStackChart = lazy(() => import("./TanStackChartView.tsx"));
export interface BarChartProps extends CartesianChartProps {
  horizontal?: boolean;
}
export function BarChart({
  label,
  tableLabel,
  categories,
  series,
  locale = "nl-NL",
  horizontal = false,
}: BarChartProps) {
  return (
    <div className="ts-chart ts-bar-chart">
      <Suspense fallback={<div className="ts-chart__loading" aria-hidden="true" />}>
        <TanStackChart
          kind="bar"
          label={label}
          categories={categories}
          series={series}
          locale={locale}
          horizontal={horizontal}
        />
      </Suspense>
      <ChartTable label={tableLabel} categories={categories} series={series} locale={locale} />
    </div>
  );
}
