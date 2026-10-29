import { ChartSvg, ChartTable, chartColors, chartDashes, chartNumber, useChartTooltip } from "./chart.tsx";
import type { CartesianChartProps } from "./chart.tsx";
export interface LineChartProps extends CartesianChartProps {
  area?: boolean;
}
export function LineChart({ label, tableLabel, categories, series, locale = "nl-NL", area = false }: LineChartProps) {
  const { mark, tooltip } = useChartTooltip(),
    values = series.flatMap((s) => s.values),
    min = Math.min(0, ...values),
    max = Math.max(1, ...values),
    x = (i: number) => 56 + (i * 400) / Math.max(1, categories.length - 1),
    y = (v: number) => 250 - ((v - min) / (max - min)) * 210;
  return (
    <div className="ts-chart">
      <ChartSvg label={label}>
        {Array.from({ length: 5 }, (_, i) => {
          const v = min + ((max - min) * i) / 4;
          return (
            <g key={i} className="ts-chart__grid">
              <line x1="50" x2="468" y1={y(v)} y2={y(v)} />
              <text x="44" y={y(v) + 4} textAnchor="end">
                {chartNumber(v, locale)}
              </text>
            </g>
          );
        })}
        {categories.map((c, i) => (
          <text key={`${c}-${i}`} x={x(i)} y="276" textAnchor="middle" className="ts-chart__label">
            {c}
          </text>
        ))}
        {series.map((s, si) => {
          const palette = s.paletteIndex ?? si,
            color = chartColors[palette % chartColors.length],
            points = categories.map((_, i) => `${x(i)},${y(s.values[i] ?? 0)}`).join(" ");
          return (
            <g key={s.id} style={{ color }}>
              {area && categories.length > 0 && (
                <polygon
                  points={`${x(0)},${y(0)} ${points} ${x(categories.length - 1)},${y(0)}`}
                  fill="currentColor"
                  opacity="0.12"
                />
              )}
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={chartDashes[palette % chartDashes.length]}
              />
              {categories.map((c, i) => {
                const px = x(i),
                  py = y(s.values[i] ?? 0),
                  text = `${s.label}, ${c}: ${chartNumber(s.values[i] ?? 0, locale)}`;
                return (
                  <g key={`${c}-${i}`} {...mark(text, px, py)} className="ts-chart__mark">
                    <circle cx={px} cy={py} r="12" fill="transparent" />
                    <circle cx={px} cy={py} r="5" fill="var(--ts-surface)" stroke="currentColor" strokeWidth="3" />
                  </g>
                );
              })}
              <line
                x1="490"
                x2="515"
                y1={48 + si * 26}
                y2={48 + si * 26}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={chartDashes[palette % chartDashes.length]}
              />
              <text x="522" y={52 + si * 26} className="ts-chart__label">
                {s.label}
              </text>
            </g>
          );
        })}
        {tooltip}
      </ChartSvg>
      <ChartTable label={tableLabel} categories={categories} series={series} locale={locale} />
    </div>
  );
}
