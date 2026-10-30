import { isValidElement } from "react";
import type { ReactNode } from "react";
import { Badge, BarChart, Card, DonutChart, LineChart, StatCard } from "@talentstroom/ui";
import type { Locale } from "@talentstroom/i18n";
import "./dashboard-widgets.css";

export function DashboardGrid({ children }: { children: ReactNode }) {
  return <div className="demo-b-grid">{children}</div>;
}
export function Kpis({
  items,
  locale,
}: {
  items: Array<{
    label: string;
    value: number;
    icon: "euro" | "handshake" | "group" | "person" | "event" | "payments";
    format?: Intl.NumberFormatOptions;
    tone?: "primary" | "success" | "violet" | "accent";
    description?: string;
  }>;
  locale: Locale;
}) {
  return (
    <div className={`demo-b-kpis demo-b-kpis--${items.length}`}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          {...(item.tone ? { tone: item.tone } : {})}
          {...(item.description ? { description: item.description } : {})}
          locale={item.format?.style === "currency" ? "nl-NL" : locale}
          {...(item.format ? { formatOptions: item.format } : {})}
        />
      ))}
    </div>
  );
}
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card as="section" variant="data" title={title} className={`demo-b-panel ${className}`}>
      {children}
    </Card>
  );
}
function cellKey(cell: ReactNode): string {
  if (isValidElement(cell)) return cell.key ?? "element";
  return typeof cell === "string" || typeof cell === "number" ? String(cell) : "empty";
}
export function SimpleTable({ label, columns, rows }: { label: string; columns: string[]; rows: ReactNode[][] }) {
  return (
    <section className="demo-b-table-wrap" aria-label={label}>
      <table className="demo-b-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={cellKey(row[0])}>
              {columns.map((column, columnIndex) => (
                <td
                  key={column}
                  className={
                    typeof row[columnIndex] === "string" && row[columnIndex].startsWith("€")
                      ? "demo-b-table__amount"
                      : undefined
                  }
                >
                  {row[columnIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
export function Status({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info";
}) {
  return (
    <Badge tone={tone} variant="subtle">
      {children}
    </Badge>
  );
}
export function Bars({
  title,
  categories,
  values,
  locale,
}: {
  title: string;
  categories: string[];
  values: number[];
  locale: Locale;
}) {
  return (
    <BarChart
      label={title}
      tableLabel={title}
      categories={categories}
      series={[{ id: "main", label: title, values }]}
      locale={locale}
    />
  );
}
export function Donut({
  title,
  data,
  locale,
}: {
  title: string;
  data: Array<{ id: string; label: string; value: number }>;
  locale: Locale;
}) {
  return <DonutChart label={title} tableLabel={title} data={data} locale={locale} />;
}
export function Trend({
  title,
  secondaryTitle,
  categories,
  values,
  secondaryValues,
  locale,
}: {
  title: string;
  secondaryTitle: string;
  categories: string[];
  values: number[];
  secondaryValues: number[];
  locale: Locale;
}) {
  return (
    <LineChart
      label={`${title} / ${secondaryTitle}`}
      tableLabel={`${title} / ${secondaryTitle}`}
      categories={categories}
      series={[
        { id: "won", label: title, values },
        { id: "lost", label: secondaryTitle, paletteIndex: 1, values: secondaryValues },
      ]}
      locale={locale}
    />
  );
}
