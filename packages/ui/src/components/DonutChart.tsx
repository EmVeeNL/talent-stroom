import { lazy, Suspense } from "react";
import { ChartTable } from "./chart.tsx";
const TanStackChart = lazy(() => import("./TanStackChartView.tsx"));
export interface DonutDatum {
  id: string;
  label: string;
  value: number;
}
export interface DonutChartProps {
  label: string;
  tableLabel: string;
  data: DonutDatum[];
  locale?: string;
}
export function DonutChart({ label, tableLabel, data, locale = "nl-NL" }: DonutChartProps) {
  const series = [{ id: "value", label, values: data.map((datum) => datum.value) }];
  return (
    <div className="ts-chart ts-donut-chart">
      <Suspense fallback={<div className="ts-chart__loading" aria-hidden="true" />}>
        <TanStackChart
          kind="donut"
          label={label}
          categories={data.map((datum) => datum.label)}
          series={series}
          locale={locale}
          donutData={data}
        />
      </Suspense>
      <ChartTable label={tableLabel} categories={data.map((datum) => datum.label)} series={series} locale={locale} />
    </div>
  );
}
