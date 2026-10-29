import {
  Badge,
  StatusPill,
  StageBadge,
  FilterChip,
  RECRUITMENT_STAGE_IDS,
  RECRUITMENT_STAGES,
  CUSTOM_LABEL_TONE,
  Card,
  StatCard,
  TrendIndicator,
  Progress,
  Button,
} from "@talentstroom/ui";
import type { MessageKey } from "@talentstroom/i18n";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
const tones = ["neutral", "success", "warning", "danger", "info"] as const;
export function Metrics() {
  const { tr, locale } = useGallery();
  const comparisonLabel = tr("gallery.metrics.comparison");
  return (
    <>
      <Section title={tr("gallery.metrics.title")}>
        <StatCard
          label={tr("gallery.metrics.placements")}
          value={24}
          icon="handshake"
          trend={{ value: 12.5, comparisonLabel, locale }}
          description={tr("gallery.metrics.description")}
          badge={<StatusPill tone="success">{tr("gallery.badges.success")}</StatusPill>}
        />
        <StatCard
          label={tr("gallery.metrics.revenue")}
          value={128450}
          formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
          trend={{ value: 8.2, comparisonLabel, locale }}
        />
        <StatCard
          label={tr("gallery.metrics.time")}
          value={28}
          trend={{ value: -6.7, upIsGood: false, comparisonLabel, locale }}
        />
        <StatCard label={tr("gallery.cards.title")} value={12} />
      </Section>
      <Section title={tr("gallery.metrics.comparison")}>
        <TrendIndicator value={12.5} comparisonLabel={comparisonLabel} locale={locale} />
        <TrendIndicator value={-8} comparisonLabel={comparisonLabel} locale={locale} />
        <TrendIndicator value={0} comparisonLabel={comparisonLabel} locale={locale} />
        <TrendIndicator value={4} upIsGood={false} comparisonLabel={comparisonLabel} locale={locale} />
        <TrendIndicator value={-4} upIsGood={false} comparisonLabel={comparisonLabel} locale={locale} />
      </Section>
      <Section title={tr("gallery.metrics.progress")}>
        <div className="gallery-data-grid">
          {tones.map((tone, i) => (
            <Progress
              key={tone}
              label={`${tr("gallery.metrics.target")} · ${tr(`gallery.badges.${tone}`)}`}
              value={i * 25}
              tone={tone}
            />
          ))}
          <Progress label={tr("gallery.metrics.loading")} />
        </div>
      </Section>
      <Section title={tr("gallery.metrics.stageLabels")}>
        {RECRUITMENT_STAGE_IDS.map((stage) => {
          const definition = RECRUITMENT_STAGES[stage];
          const labelKey = definition.labelKey[locale === "nl-NL" ? "nl" : "en"] as MessageKey;
          return (
            <StageBadge key={stage} stage={stage}>
              {tr(labelKey)}
            </StageBadge>
          );
        })}
        <StatusPill tone={CUSTOM_LABEL_TONE}>{tr("gallery.metrics.customTone")}</StatusPill>
        <FilterChip kind="add" onClick={() => {}}>
          {tr("gallery.metrics.customLabel")}
        </FilterChip>
        <Badge tone="info" variant="solid" dot>
          {tr("gallery.badges.info")}
        </Badge>
        <Badge tone="danger" variant="solid" dot>
          {tr("gallery.badges.danger")}
        </Badge>
      </Section>
      <Section title={tr("gallery.cards")}>
        <Card
          as="section"
          title={tr("gallery.cards.title")}
          actions={
            <Button variant="ghost" size="sm">
              {tr("gallery.cards.action")}
            </Button>
          }
        >
          {tr("gallery.cards.body")}
        </Card>
        <Card>{tr("gallery.cards.plain")}</Card>
      </Section>
    </>
  );
}
