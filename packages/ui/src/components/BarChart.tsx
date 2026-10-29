import { useId } from "react";
import { ChartSvg, ChartTable, chartColors, chartNumber, useChartTooltip } from "./chart.tsx";
import type { CartesianChartProps } from "./chart.tsx";
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
  const id = useId(),
    { mark, tooltip } = useChartTooltip(),
    max = Math.max(1, ...series.flatMap((s) => s.values)),
    band = (horizontal ? 220 : 460) / Math.max(1, categories.length),
    bar = (band * 0.7) / Math.max(1, series.length);
  return (
    <div className="ts-chart ts-bar-chart">
      <ChartSvg label={label}>
        <defs>
          {series.map((s, si) => (
            <pattern
              key={s.id}
              id={`${id}-${si}`}
              patternUnits="userSpaceOnUse"
              width={4 + si * 3}
              height={4 + si * 3}
              patternTransform={`rotate(${si % 2 ? 45 : 0})`}
            >
              <rect width="100%" height="100%" fill={chartColors[(s.paletteIndex ?? si) % chartColors.length]} />
              {si > 0 && <line x1="0" x2="0" y1="0" y2="16" stroke="var(--ts-surface)" strokeWidth="2" />}
            </pattern>
          ))}
        </defs>
        {categories.map((c, i) => (
          <g key={`${c}-${i}`}>
            <text
              x={horizontal ? 125 : 65 + i * band + band / 2}
              y={horizontal ? 50 + i * band + band / 2 : 276}
              textAnchor={horizontal ? "end" : "middle"}
              className="ts-chart__label"
            >
              {c}
            </text>
            {series.map((s, si) => {
              const value = Math.max(0, s.values[i] ?? 0),
                length = (value / max) * (horizontal ? 365 : 205),
                px = horizontal ? 145 : 65 + i * band + band * 0.15 + si * bar,
                py = horizontal ? 40 + i * band + band * 0.15 + si * bar : 250 - length;
              return (
                <g
                  key={s.id}
                  {...mark(`${s.label}, ${c}: ${chartNumber(value, locale)}`, px + (horizontal ? length : bar) / 2, py)}
                  className="ts-chart__mark"
                >
                  <rect
                    x={px}
                    y={py}
                    width={horizontal ? length : Math.max(1, bar - 3)}
                    height={horizontal ? Math.max(1, bar - 3) : length}
                    fill={`url(#${id}-${si})`}
                  />
                  <text
                    x={horizontal ? px + length + 5 : px + bar / 2}
                    y={horizontal ? py + bar / 2 + 4 : py - 6}
                    textAnchor={horizontal ? "start" : "middle"}
                    className="ts-chart__label"
                  >
                    {chartNumber(value, locale)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
        {series.map((s, si) => (
          <g key={s.id}>
            <rect
              x="65"
              y={294}
              width="12"
              height="12"
              fill={`url(#${id}-${si})`}
              transform={`translate(${si * 150},0)`}
            />
            <text x={83 + si * 150} y="305" className="ts-chart__label">
              {s.label}
            </text>
          </g>
        ))}
        {tooltip}
      </ChartSvg>
      <ChartTable label={tableLabel} categories={categories} series={series} locale={locale} />
    </div>
  );
}
