import { ChartSvg, ChartTable, chartColors, chartDashes, chartNumber, useChartTooltip } from "./chart.tsx";
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
  const total = data.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    { mark, tooltip } = useChartTooltip(),
    radius = 95,
    circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="ts-chart ts-donut-chart">
      <ChartSvg label={label}>
        <circle cx="175" cy="150" r={radius} fill="none" stroke="var(--ts-surface-muted)" strokeWidth="38" />
        {data.map((s, i) => {
          const fraction = total > 0 ? Math.max(0, s.value) / total : 0,
            start = offset;
          offset += fraction;
          const angle = (start + fraction / 2) * Math.PI * 2 - Math.PI / 2,
            px = 175 + Math.cos(angle) * 120,
            py = 150 + Math.sin(angle) * 120;
          return (
            <g key={s.id} {...mark(`${s.label}: ${chartNumber(s.value, locale)}`, px, py)} className="ts-chart__mark">
              <circle
                cx="175"
                cy="150"
                r={radius}
                fill="none"
                stroke={chartColors[i % chartColors.length]}
                strokeWidth="38"
                strokeDasharray={`${Math.max(0, fraction * circumference - 3)} ${circumference}`}
                strokeDashoffset={-start * circumference}
                transform="rotate(-90 175 150)"
              />
              {fraction > 0 && (
                <>
                  <line
                    x1={175 + Math.cos(angle) * 116}
                    y1={150 + Math.sin(angle) * 116}
                    x2={px}
                    y2={py}
                    stroke="var(--ts-text)"
                  />
                  <text
                    x={175 + Math.cos(angle) * 139}
                    y={154 + Math.sin(angle) * 139}
                    textAnchor="middle"
                    className="ts-chart__label"
                  >
                    {i + 1}
                  </text>
                </>
              )}
              <line
                x1="345"
                x2="370"
                y1={55 + i * 36}
                y2={55 + i * 36}
                stroke={chartColors[i % chartColors.length]}
                strokeWidth="4"
                strokeDasharray={chartDashes[i % chartDashes.length]}
              />
              <text x="380" y={59 + i * 36} className="ts-chart__label">
                {i + 1}. {s.label}: {chartNumber(s.value, locale)}
              </text>
            </g>
          );
        })}
        <text x="175" y="158" textAnchor="middle" className="ts-donut-chart__total">
          {chartNumber(total, locale)}
        </text>
        {tooltip}
      </ChartSvg>
      <ChartTable
        label={tableLabel}
        categories={data.map((s) => s.label)}
        series={[{ id: "value", label, values: data.map((s) => s.value) }]}
        locale={locale}
      />
    </div>
  );
}
