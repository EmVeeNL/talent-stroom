import { useEffect, useMemo, useState } from "react";
import { Chart } from "@tanstack/charts/react";
import { areaY } from "@tanstack/charts/area";
import { barX, barY } from "@tanstack/charts/bar";
import { lineY } from "@tanstack/charts/line";
import { group } from "@tanstack/charts/group";
import { pie, polar, radialArc } from "@tanstack/charts/polar";
import { defineChart } from "@tanstack/charts";
import type { ChartMark, DomChartDefinition } from "@tanstack/charts";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { chartColors, chartNumber } from "./chart.tsx";
import type { ChartSeries } from "./chart.tsx";

interface Props {
  kind: "bar" | "line" | "donut";
  label: string;
  categories: string[];
  series: ChartSeries[];
  locale: string;
  horizontal?: boolean;
  area?: boolean;
  donutData?: { id: string; label: string; value: number }[];
}
interface Datum {
  category: string;
  value: number;
  series: string;
  seriesId: string;
}

export default function TanStackChartView({
  kind,
  label,
  categories,
  series,
  locale,
  horizontal = false,
  area = false,
  donutData = [],
}: Props) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset["theme"] ?? "system");
  const [tooltipText, setTooltipText] = useState<string>();
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.dataset["theme"] ?? "system"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!window.matchMedia) return () => {};
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTooltipText(undefined);
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, []);
  const rows = useMemo(
    () =>
      series.flatMap((item) =>
        categories.map(
          (category, index) =>
            ({
              category,
              value: Math.max(0, item.values[index] ?? 0),
              series: item.label,
              seriesId: item.id,
            }) satisfies Datum,
        ),
      ),
    [categories, series],
  );
  const definition = useMemo(() => {
    if (kind === "donut") {
      const positiveTotal = donutData.reduce((sum, item) => sum + Math.max(0, item.value), 0);
      const positive =
        positiveTotal > 0
          ? donutData.map((item) => ({ ...item, value: Math.max(0, item.value) }))
          : [{ id: "empty", label: "", value: 1 }];
      const slices = pie(positive, { value: "value" });
      return defineChart({
        marks: [
          polar({
            marks: [
              radialArc(slices, {
                innerRadius: 56,
                outerRadius: 98,
                fill: (datum) =>
                  positiveTotal > 0
                    ? (chartColors[datum.index % chartColors.length] ?? "var(--ts-primary)")
                    : "var(--ts-surface-muted)",
                stroke: "var(--ts-surface)",
                strokeWidth: 2,
              }),
            ] as const,
            scales: { angle: null, radius: null },
          }),
        ] as const,
        scales: { x: null, y: null },
        svgAnimation: false,
      });
    }
    const marks: ChartMark<Datum>[] = [];
    if (kind === "bar") {
      const fill = (datum: Datum) => {
        const palette =
          series.find((item) => item.id === datum.seriesId)?.paletteIndex ??
          series.findIndex((item) => item.id === datum.seriesId);
        return chartColors[palette % chartColors.length] ?? "var(--ts-primary)";
      };
      marks.push(
        horizontal
          ? barX(rows, { x: "value", y: "category", z: "seriesId", fill, layout: group() })
          : barY(rows, { x: "category", y: "value", z: "seriesId", fill, layout: group() }),
      );
    }
    for (const item of series) {
      if (kind === "bar") break;
      const source = rows.filter((row) => row.seriesId === item.id);
      const color =
        chartColors[(item.paletteIndex ?? series.indexOf(item)) % chartColors.length] ?? "var(--ts-primary)";
      if (area) {
        marks.push(
          areaY(source, { x: "category", y: "value", fill: color, fillOpacity: 0.12, stroke: color, strokeWidth: 2 }),
        );
      } else {
        marks.push(lineY(source, { x: "category", y: "value", stroke: color, strokeWidth: 3, points: true }));
      }
    }
    return defineChart(
      {
        chart: () => ({
          marks,
          scales: {
            x: horizontal
              ? {
                  scale: scaleLinear,
                  nice: true,
                  grid: true,
                  axis: {
                    ticks: {
                      format: (value: number) =>
                        new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value),
                    },
                  },
                }
              : { scale: () => scaleBand().padding(0.2) },
            y: horizontal
              ? { scale: () => scaleBand().padding(0.2) }
              : {
                  scale: scaleLinear,
                  nice: true,
                  grid: true,
                  axis: {
                    ticks: {
                      format: (value: number) =>
                        new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value),
                    },
                  },
                },
          },
        }),
      },
      { focus: "group-x", svgAnimation: false },
    );
  }, [area, donutData, horizontal, kind, locale, rows, series, theme]) as DomChartDefinition;
  const donutTotal = donutData.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  return (
    <div
      data-chart-theme={theme}
      data-chart-animation="off"
      data-chart-reduced-motion={reducedMotion ? "yes" : "no"}
      className="ts-chart__canvas"
    >
      <Chart
        definition={definition}
        height={300}
        initialWidth={640}
        ariaLabel={label}
        onFocusChange={(point) => {
          if (!point) {
            setTooltipText(undefined);
            return;
          }
          const datum = point.datum;
          const record = typeof datum === "object" && datum !== null ? datum : undefined;
          const value = record && "value" in record ? Number(record.value) : Number(point.yValue);
          const category =
            record && "category" in record
              ? String(record.category)
              : record && "label" in record
                ? String(record.label)
                : String(point.xValue);
          const groupLabel = record && "series" in record ? String(record.series) : point.groupLabel || label;
          setTooltipText(`${groupLabel}, ${category}: ${chartNumber(Number.isFinite(value) ? value : 0, locale)}`);
        }}
      />
      {kind === "donut" && (
        <>
          <span className="ts-donut-chart__total" aria-hidden="true">
            {chartNumber(donutTotal, locale)}
          </span>
          <ul className="ts-donut-chart__legend" aria-label={label}>
            {donutData.map((item, index) => (
              <li key={item.id}>
                <span aria-hidden="true" style={{ background: chartColors[index % chartColors.length] }} />
                {item.label}: {chartNumber(item.value, locale)}
              </li>
            ))}
          </ul>
        </>
      )}
      {tooltipText && (
        <div className="ts-chart__tooltip" role="tooltip">
          {tooltipText}
        </div>
      )}
    </div>
  );
}
