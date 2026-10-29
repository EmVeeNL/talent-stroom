import { useState } from "react";
import { Card, LineChart, BarChart, DonutChart, ChartLegend } from "@talentstroom/ui";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
export function Charts() {
  const { tr, locale } = useGallery();
  const [visible, setVisible] = useState(["a", "b"]);
  const series = [
    { id: "a", paletteIndex: 0, label: tr("gallery.charts.teamA"), values: [3, 5, 4, 8, 6, 9] },
    { id: "b", paletteIndex: 1, label: tr("gallery.charts.teamB"), values: [2, 3, 6, 4, 5, 7] },
  ];
  const categories = [
    tr("gallery.charts.month1"),
    tr("gallery.charts.month2"),
    tr("gallery.charts.month3"),
    tr("gallery.charts.month4"),
    tr("gallery.charts.month5"),
    tr("gallery.charts.month6"),
  ];
  const filtered = series.filter((s) => visible.includes(s.id));
  const tableLabel = tr("gallery.charts.table");
  const stages = [
    tr("gallery.charts.stages.open"),
    tr("gallery.charts.stages.intake"),
    tr("gallery.charts.stages.interview"),
    tr("gallery.charts.stages.offer"),
  ];
  const bars = [{ id: "vacancies", label: tr("gallery.charts.series"), values: [12, 8, 5, 3] }];
  return (
    <>
      <Section title={tr("gallery.charts.line")}>
        <div className="gallery-stack">
          <ChartLegend label={tr("gallery.charts.legend")} items={series} visibleIds={visible} onChange={setVisible} />
          {visible.length === 0 && <output>{tr("gallery.charts.hidden")}</output>}
          <div className="gallery-data-grid">
            <Card title={tr("gallery.charts.placements")}>
              <LineChart
                label={tr("gallery.charts.placements")}
                tableLabel={tableLabel}
                categories={categories}
                series={filtered}
                locale={locale}
              />
            </Card>
            <Card title={tr("gallery.metrics.target")}>
              <LineChart
                label={tr("gallery.charts.placements")}
                tableLabel={tableLabel}
                categories={categories}
                series={filtered}
                area
                locale={locale}
              />
            </Card>
          </div>
        </div>
      </Section>
      <Section title={tr("gallery.charts.bar")}>
        <div className="gallery-data-grid">
          <Card title={tr("gallery.charts.vacancies")}>
            <BarChart
              label={tr("gallery.charts.vacancies")}
              tableLabel={tableLabel}
              categories={stages}
              series={bars}
              locale={locale}
            />
          </Card>
          <Card title={tr("gallery.charts.vacancies")}>
            <BarChart
              label={tr("gallery.charts.vacancies")}
              tableLabel={tableLabel}
              categories={stages}
              series={[
                { id: "a", paletteIndex: 0, label: tr("gallery.charts.teamA"), values: [8, 5, 3, 2] },
                { id: "b", paletteIndex: 1, label: tr("gallery.charts.teamB"), values: [4, 3, 2, 1] },
              ]}
              horizontal
              locale={locale}
            />
          </Card>
        </div>
      </Section>
      <Section title={tr("gallery.charts.donut")}>
        <div className="gallery-data-grid">
          <Card title={tr("gallery.charts.sources")}>
            <DonutChart
              label={tr("gallery.charts.sources")}
              tableLabel={tableLabel}
              locale={locale}
              data={[
                { id: "ref", label: tr("gallery.data.source.referral"), value: 48 },
                { id: "web", label: tr("gallery.data.source.website"), value: 32 },
                { id: "event", label: tr("gallery.data.source.event"), value: 20 },
              ]}
            />
          </Card>
          <Card title={tr("gallery.charts.empty")}>
            <DonutChart label={tr("gallery.charts.empty")} tableLabel={tableLabel} data={[]} />
          </Card>
        </div>
      </Section>
    </>
  );
}
