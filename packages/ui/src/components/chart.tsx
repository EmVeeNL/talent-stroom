import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
export interface ChartSeries {
  id: string;
  label: string;
  values: number[];
  /** Preserve series identity when filtering the data passed to a chart. */
  paletteIndex?: number;
}
export interface CartesianChartProps {
  label: string;
  tableLabel: string;
  categories: string[];
  series: ChartSeries[];
  locale?: string;
}
export const chartColors = ["var(--ts-primary)", "var(--ts-success)", "var(--ts-danger)", "var(--ts-text-muted)"];
export const chartDashes = ["none", "8 4", "2 4", "10 3 2 3"];
export const chartNumber = (value: number, locale = "nl-NL") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
export function ChartTable({ label, categories, series, locale }: Omit<CartesianChartProps, "tableLabel">) {
  return (
    <details className="ts-chart__data">
      <summary>{label}</summary>
      <div className="ts-chart__table">
        <table>
          <caption className="ts-visually-hidden">{label}</caption>
          <thead>
            <tr>
              <td aria-hidden="true" />
              {series.map((s) => (
                <th key={s.id} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, i) => (
              <tr key={`${category}-${i}`}>
                <th scope="row">{category}</th>
                {series.map((s) => (
                  <td key={s.id}>{chartNumber(s.values[i] ?? 0, locale)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export function useChartTooltip() {
  const id = useId(),
    [tip, setTip] = useState<{ text: string; x: number; y: number }>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focused = useRef(false);
  const cancel = () => clearTimeout(timer.current);
  const hide = () => {
    cancel();
    timer.current = setTimeout(() => {
      if (!focused.current) setTip(undefined);
    }, 120);
  };
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearTimeout(timer.current);
        setTip(undefined);
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener("keydown", dismiss);
    };
  }, []);
  const mark = (text: string, x: number, y: number): SVGProps<SVGGElement> & { "data-chart-mark": string } => ({
    role: "img",
    tabIndex: 0,
    "data-chart-mark": "",
    "aria-label": text,
    "aria-describedby": tip?.text === text ? id : undefined,
    onFocus: () => {
      focused.current = true;
      cancel();
      setTip({ text, x, y });
    },
    onBlur: () => {
      focused.current = false;
      hide();
    },
    onMouseEnter: () => {
      cancel();
      setTip({ text, x, y });
    },
    onMouseLeave: hide,
    onKeyDown: (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
        setTip(undefined);
      }
    },
  });
  const width = Math.min(624, Math.max(150, (tip?.text.length ?? 0) * 7 + 16));
  const tooltip = tip ? (
    <g
      id={id}
      role="tooltip"
      className="ts-chart__tooltip"
      transform={`translate(${Math.min(632 - width, Math.max(8, tip.x - width / 2))},${Math.max(4, tip.y - 42)})`}
      onMouseEnter={cancel}
      onMouseLeave={hide}
    >
      <rect width={width} height="32" rx="6" />
      <text x="8" y="21" textLength={width === 624 ? 608 : undefined} lengthAdjust="spacingAndGlyphs">
        {tip.text}
      </text>
    </g>
  ) : null;
  return { mark, tooltip };
}
export function ChartSvg({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 640 320" role="img" aria-label={label} className="ts-chart__svg">
      <title>{label}</title>
      {children}
    </svg>
  );
}
