import { useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { BarChart, Breadcrumb, Card, ChartLegend, DonutChart, LineChart, PageHeader } from "@talentstroom/ui";
import type { ChartSeries } from "@talentstroom/ui";
import "./data-pages.css";

export default function GrafiekenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.data.grafieken");
  const [visible, setVisible] = useState(["utrecht", "noord"]);
  const tableLabel = t(locale, "demo.data.charts.table");
  const series: [ChartSeries, ChartSeries] = [
    { id: "utrecht", paletteIndex: 0, label: t(locale, "demo.data.charts.teamA"), values: [4, 6, 5, 8, 7, 11] },
    { id: "noord", paletteIndex: 1, label: t(locale, "demo.data.charts.teamB"), values: [2, 3, 5, 4, 7, 8] },
  ];
  const [teamUtrecht, teamNorth] = series;
  const categories = [
    t(locale, "demo.data.charts.month1"),
    t(locale, "demo.data.charts.month2"),
    t(locale, "demo.data.charts.month3"),
    t(locale, "demo.data.charts.month4"),
    t(locale, "demo.data.charts.month5"),
    t(locale, "demo.data.charts.month6"),
  ];
  const stages = [
    t(locale, "demo.data.charts.stages.open"),
    t(locale, "demo.data.charts.stages.intake"),
    t(locale, "demo.data.charts.stages.interview"),
    t(locale, "demo.data.charts.stages.offer"),
  ];
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.data") }, { label: title }]}
      />
      <PageHeader title={title} />
      <div className="data-page-stack">
        <Card as="section" title={t(locale, "demo.data.charts.line")}>
          <ChartLegend
            label={t(locale, "demo.data.charts.legend")}
            items={series}
            visibleIds={visible}
            onChange={setVisible}
          />
          {visible.length === 0 ? <output>{t(locale, "demo.data.charts.hidden")}</output> : null}
          <div className="data-chart-grid">
            <div>
              <h3>{t(locale, "demo.data.charts.placements")}</h3>
              <LineChart
                label={t(locale, "demo.data.charts.placements")}
                tableLabel={tableLabel}
                categories={categories}
                series={series.filter((item) => visible.includes(item.id))}
                locale={locale}
              />
            </div>
            <div>
              <h3>{t(locale, "demo.data.metrics.target")}</h3>
              <LineChart
                label={t(locale, "demo.data.charts.placements")}
                tableLabel={tableLabel}
                categories={categories}
                series={series.filter((item) => visible.includes(item.id))}
                area
                locale={locale}
              />
            </div>
          </div>
        </Card>
        <div className="data-chart-grid">
          <Card as="section" title={t(locale, "demo.data.charts.bar")}>
            <BarChart
              label={t(locale, "demo.data.charts.vacancies")}
              tableLabel={tableLabel}
              categories={stages}
              series={[{ id: "openings", label: t(locale, "demo.data.charts.series"), values: [12, 8, 5, 3] }]}
              locale={locale}
            />
          </Card>
          <Card as="section" title={t(locale, "demo.data.charts.bar")}>
            <BarChart
              label={t(locale, "demo.data.charts.vacancies")}
              tableLabel={tableLabel}
              categories={stages}
              series={[
                { ...teamUtrecht, values: [8, 5, 3, 2] },
                { ...teamNorth, values: [4, 3, 2, 1] },
              ]}
              horizontal
              locale={locale}
            />
          </Card>
        </div>
        <div className="data-chart-grid">
          <Card as="section" title={t(locale, "demo.data.charts.donut")}>
            <DonutChart
              label={t(locale, "demo.data.charts.sources")}
              tableLabel={tableLabel}
              locale={locale}
              data={[
                { id: "referral", label: t(locale, "demo.data.data.source.referral"), value: 48 },
                { id: "website", label: t(locale, "demo.data.data.source.website"), value: 32 },
                { id: "event", label: t(locale, "demo.data.data.source.event"), value: 20 },
              ]}
            />
          </Card>
          <Card as="section" title={t(locale, "demo.data.charts.empty")}>
            <DonutChart label={t(locale, "demo.data.charts.empty")} tableLabel={tableLabel} data={[]} locale={locale} />
          </Card>
        </div>
      </div>
    </>
  );
}
