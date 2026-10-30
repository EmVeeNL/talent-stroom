import { useRef, useState } from "react";
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
  ContextMenu,
} from "@talentstroom/ui";
import type { MessageKey } from "@talentstroom/i18n";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";
const tones = ["neutral", "success", "warning", "danger", "info"] as const;
export function Metrics() {
  const { tr, locale } = useGallery();
  const comparisonLabel = tr("gallery.metrics.comparison");
  const [message, setMessage] = useState("");
  const [removed, setRemoved] = useState(false);
  const confirmation = useRef<HTMLDialogElement>(null);
  const update = () => setMessage(tr("gallery.cards.updated"));
  const menuItems = [
    { id: "refresh", label: tr("gallery.cards.refresh"), icon: "refresh" as const, onSelect: update },
    { id: "export", label: tr("gallery.cards.export"), icon: "download" as const, disabled: true, onSelect: update },
    { id: "settings", label: tr("gallery.cards.settings"), icon: "settings" as const, onSelect: update },
    { id: "copy", label: tr("gallery.cards.duplicate"), icon: "content_copy" as const, onSelect: update },
    { id: "separator", separator: true as const },
    {
      id: "delete",
      label: tr("gallery.cards.delete"),
      icon: "delete" as const,
      tone: "danger" as const,
      onSelect: () => confirmation.current?.showModal(),
    },
  ];
  return (
    <>
      <Section title={tr("gallery.metrics.title")}>
        <div className="gallery-kpi-row">
          {(
            [
              { label: tr("gallery.metrics.candidates"), value: 1248, icon: "person", tone: "primary", change: 12 },
              { label: tr("gallery.metrics.vacancies"), value: 86, icon: "work", tone: "success", change: 8 },
              { label: tr("gallery.metrics.placements"), value: 34, icon: "handshake", tone: "violet", change: 21 },
              { label: tr("gallery.metrics.clients"), value: 48, icon: "business", tone: "accent", change: 5 },
            ] as const
          ).map((stat) => (
            <StatCard
              key={stat.label}
              {...stat}
              locale={locale}
              trend={{ value: stat.change, comparisonLabel, locale }}
              sparkline={{ values: [2, 1, 3, 5, 4, 6, 7], label: tr("gallery.metrics.sparkline") }}
            />
          ))}
        </div>
      </Section>
      <Section title={tr("gallery.cards")}>
        <div className="gallery-card-examples">
          {!removed && (
            <Card
              as="section"
              variant="widget"
              title={tr("gallery.cards.title")}
              subtitle={tr("gallery.metrics.description")}
              menuLabel={tr("gallery.cards.more")}
              menuItems={menuItems}
            >
              {tr("gallery.cards.body")}
            </Card>
          )}
          <Card
            title={tr("gallery.cards.menu")}
            headerActions={<ContextMenu triggerLabel={tr("gallery.cards.more")} items={menuItems} defaultOpen />}
          >
            {tr("gallery.cards.body")}
          </Card>
          <Card
            variant="data"
            selected
            title={tr("gallery.cards.selected")}
            headerActions={
              <Button size="sm" variant="ghost" onClick={update}>
                {tr("gallery.cards.action")}
              </Button>
            }
          >
            <div className="gallery-card-data">{tr("gallery.cards.body")}</div>
          </Card>
          <Card title={tr("gallery.cards.loading")} loading />
          <Card>{tr("gallery.cards.plain")}</Card>
        </div>
        <output className="gallery-wide" aria-live="polite">
          {message}
        </output>
        <dialog ref={confirmation} className="ts-dialog ts-dialog--sm" aria-labelledby="widget-confirm-title">
          <div className="ts-dialog__body">
            <h2 id="widget-confirm-title">{tr("gallery.cards.confirm")}</h2>
          </div>
          <div className="ts-dialog__footer">
            <Button autoFocus variant="secondary" onClick={() => confirmation.current?.close()}>
              {tr("gallery.cards.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setRemoved(true);
                confirmation.current?.close();
              }}
            >
              {tr("gallery.cards.delete")}
            </Button>
          </div>
        </dialog>
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
    </>
  );
}
