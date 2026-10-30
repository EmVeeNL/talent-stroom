import { lazy, Suspense } from "react";
import { ChartTable } from "./chart.tsx";
import type { CartesianChartProps } from "./chart.tsx";
const TanStackChart = lazy(() => import("./TanStackChartView.tsx"));
export interface LineChartProps extends CartesianChartProps {
  area?: boolean;
}
export function LineChart({ label, tableLabel, categories, series, locale = "nl-NL", area = false }: LineChartProps) {
  return (
    <div className="ts-chart">
      <Suspense fallback={<div className="ts-chart__loading" aria-hidden="true" />}>
        <TanStackChart kind="line" label={label} categories={categories} series={series} locale={locale} area={area} />
      </Suspense>
      <ChartTable label={tableLabel} categories={categories} series={series} locale={locale} />
    </div>
  );
}
