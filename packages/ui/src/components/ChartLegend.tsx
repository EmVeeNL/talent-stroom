import { Button } from "./Button.tsx";
import { chartColors, chartDashes } from "./chart.tsx";
export interface ChartLegendProps {
  label: string;
  items: { id: string; label: string }[];
  visibleIds: string[];
  onChange: (ids: string[]) => void;
}
export function ChartLegend({ label, items, visibleIds, onChange }: ChartLegendProps) {
  return (
    <div role="group" aria-label={label} className="ts-chart-legend">
      {items.map((s, i) => (
        <Button
          key={s.id}
          variant="ghost"
          size="sm"
          aria-pressed={visibleIds.includes(s.id)}
          onClick={() =>
            onChange(visibleIds.includes(s.id) ? visibleIds.filter((id) => id !== s.id) : [...visibleIds, s.id])
          }
        >
          <svg width="28" height="12" aria-hidden="true">
            <line
              x1="0"
              x2="28"
              y1="6"
              y2="6"
              stroke={chartColors[i % chartColors.length]}
              strokeWidth="3"
              strokeDasharray={chartDashes[i % chartDashes.length]}
            />
          </svg>
          {s.label}
        </Button>
      ))}
    </div>
  );
}
