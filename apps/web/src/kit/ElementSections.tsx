import { useMemo, useState } from "react";
import type { Locale } from "@talentstroom/i18n";
import { t } from "@talentstroom/i18n";
import {
  ActivityFeed,
  Avatar,
  Badge,
  Button,
  Card,
  ContextMenu,
  Dialog,
  EmptyState,
  FilterChip,
  Icon,
  ICON_NAMES,
  Progress,
  StageBadge,
  StatCard,
  StatusPill,
  Tabs,
  TextField,
  Tooltip,
  useToast,
  Toaster,
} from "@talentstroom/ui";
import type { IconName } from "@talentstroom/ui";
import { MotionShowcase } from "./MotionShowcase.tsx";

function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card as="section" className={`demo-kit-panel${className ? ` ${className}` : ""}`} title={title}>
      {children}
    </Card>
  );
}
export function Kpis({ locale }: { locale: Locale }) {
  const tr = (
    key:
      | "demo.elements.metrics.candidates"
      | "demo.elements.metrics.vacancies"
      | "demo.elements.metrics.placements"
      | "demo.elements.metrics.clients"
      | "demo.elements.metrics.comparison"
      | "demo.elements.metrics.sparkline",
  ) => t(locale, key);
  const stats: {
    label: string;
    value: number;
    icon: IconName;
    tone: "primary" | "success" | "violet" | "accent";
    delta: number;
  }[] = [
    { label: tr("demo.elements.metrics.candidates"), value: 1248, icon: "person", tone: "primary", delta: 12 },
    { label: tr("demo.elements.metrics.vacancies"), value: 86, icon: "work", tone: "success", delta: 8 },
    { label: tr("demo.elements.metrics.placements"), value: 34, icon: "handshake", tone: "violet", delta: 21 },
    { label: tr("demo.elements.metrics.clients"), value: 48, icon: "business", tone: "accent", delta: 5 },
  ];
  return (
    <div className="demo-kit-grid demo-kit-grid--4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          tone={stat.tone}
          locale={locale}
          trend={{ value: stat.delta, comparisonLabel: tr("demo.elements.metrics.comparison"), locale }}
          sparkline={{ values: [2, 1, 3, 5, 4, 6, 7], label: tr("demo.elements.metrics.sparkline") }}
        />
      ))}
    </div>
  );
}
function ToastDemo({ locale }: { locale: Locale }) {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ tone: "success", message: t(locale, "demo.elements.cards.updated") })}>
      {t(locale, "demo.elements.overlays.successLabel")}
    </Button>
  );
}
export function ElementsBasic({ locale }: { locale: Locale }) {
  return (
    <div className="demo-kit-stack">
      <Panel title={t(locale, "demo.elements.forms.kit.buttons")}>
        <div className="demo-kit-row">
          {(
            [
              ["primary", "demo.elements.forms.kit.primary"],
              ["secondary", "demo.elements.forms.kit.secondary"],
              ["outline", "demo.elements.forms.kit.outline"],
              ["ghost", "demo.elements.forms.kit.ghost"],
              ["success", "demo.elements.forms.kit.success"],
              ["warning", "demo.elements.forms.kit.warning"],
              ["danger", "demo.elements.forms.kit.danger"],
            ] as const
          ).map(([variant, labelKey]) => (
            <Button key={variant} variant={variant}>
              {t(locale, labelKey)}
            </Button>
          ))}
        </div>
      </Panel>
      <Panel title={t(locale, "demo.elements.metrics.stageLabels")}>
        <div className="demo-kit-row">
          {(
            [
              ["nieuw", "demo.elements.stage.nieuw"],
              ["in_behandeling", "demo.elements.stage.in_behandeling"],
              ["gesprek", "demo.elements.stage.gesprek"],
              ["aanbod", "demo.elements.stage.aanbod"],
              ["geplaatst", "demo.elements.stage.geplaatst"],
              ["afgewezen", "recruitment.stage.afgewezen"],
            ] as const
          ).map(([stage, labelKey]) => (
            <StageBadge key={stage} stage={stage}>
              {t(locale, labelKey)}
            </StageBadge>
          ))}
          <Badge tone="info">{t(locale, "demo.elements.badges.info")}</Badge>
          <StatusPill tone="success">{t(locale, "demo.elements.data.status.placed")}</StatusPill>
        </div>
      </Panel>
      <Panel title={t(locale, "demo.elements.tables.avatars")}>
        <div className="demo-kit-row">
          <Avatar name="Sanne Willems" />
          <Avatar name="Joris van den Berg" size="lg" />
          <FilterChip
            kind="removable"
            removeLabel={t(locale, "demo.elements.filters.removeFilter").replace("{name}", "Functie")}
            onRemove={() => {}}
          >
            Functie
          </FilterChip>
          <Tooltip inline content={t(locale, "demo.elements.overlays.dateHint")}>
            <Button variant="secondary">{t(locale, "demo.elements.overlays.infoLabel")}</Button>
          </Tooltip>
        </div>
      </Panel>
    </div>
  );
}
export function ElementsAdvanced({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState("nieuw"),
    [expanded, setExpanded] = useState(false),
    [progress, setProgress] = useState(68);
  const tr = (
    key: "demo.elements.overlays.cancel" | "demo.elements.cards.updated" | "demo.elements.overlays.dateHint",
  ) => t(locale, key);
  const tabs = [
    {
      id: "nieuw",
      label: t(locale, "demo.elements.data.status.new"),
      panel: <p>{t(locale, "demo.elements.data.status.new")}</p>,
    },
    {
      id: "active",
      label: t(locale, "demo.elements.data.status.active"),
      panel: <p>{t(locale, "demo.elements.data.status.active")}</p>,
    },
    {
      id: "placed",
      label: t(locale, "demo.elements.data.status.placed"),
      panel: <p>{t(locale, "demo.elements.data.status.placed")}</p>,
    },
  ];
  return (
    <div className="demo-kit-grid demo-kit-grid--2">
      <Panel title={t(locale, "demo.elements.page.kanban")}>
        <Tabs tabs={tabs} label={t(locale, "demo.elements.filters.view")} selectedId={tab} onChange={setTab} />
      </Panel>
      <Panel title={t(locale, "demo.elements.overlays.staticPreviews")}>
        <details open={expanded} onToggle={(e) => setExpanded(e.currentTarget.open)}>
          <summary>{t(locale, "demo.elements.overlays.dateHint")}</summary>
          <p>{t(locale, "demo.elements.overlays.toastBody")}</p>
        </details>
        <ContextMenu
          triggerLabel={t(locale, "demo.elements.cards.more")}
          items={[{ id: "save", label: t(locale, "demo.elements.forms.kit.save"), icon: "check", onSelect: () => {} }]}
        />
        <Dialog
          title={t(locale, "demo.elements.cards.confirm")}
          triggerLabel={t(locale, "demo.elements.overlays.dialogSizes")}
          closeLabel={tr("demo.elements.overlays.cancel")}
        >
          <p>{tr("demo.elements.overlays.dateHint")}</p>
        </Dialog>
        <Progress label={t(locale, "demo.elements.metrics.progress")} value={progress} />
        <input
          aria-label={t(locale, "demo.elements.metrics.progress")}
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
        />
      </Panel>
      <Panel title={t(locale, "demo.elements.overlays.toastBody")}>
        <Toaster label={t(locale, "demo.elements.overlays.banners")} closeLabel={tr("demo.elements.overlays.cancel")}>
          <ToastDemo locale={locale} />
        </Toaster>
      </Panel>
      <MotionShowcase locale={locale} />
    </div>
  );
}
function IconSearchGrid({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const { toast } = useToast();
  const icons = useMemo(() => ICON_NAMES.filter((name) => name.includes(query.trim().toLowerCase())), [query]);
  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast({ tone: "success", message: t(locale, "demo.elements.icons.copied") });
    } catch {
      toast({ tone: "warning", message: t(locale, "demo.elements.icons.clipboardUnavailable") });
    }
  };
  return (
    <div className="demo-kit-stack">
      <TextField
        label={t(locale, "demo.elements.icons.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t(locale, "demo.elements.icons.search")}
      />
      <div className="demo-kit-icon-grid">
        {icons.map((name) => (
          <button
            type="button"
            key={name}
            onClick={() => void copy(name)}
            aria-label={`${name} ${t(locale, "demo.elements.icons.search")}`}
          >
            <Icon name={name} size={24} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
export function ElementsIcons({ locale }: { locale: Locale }) {
  return (
    <Toaster
      label={t(locale, "demo.elements.overlays.banners")}
      closeLabel={t(locale, "demo.elements.overlays.cancel")}
    >
      <IconSearchGrid locale={locale} />
    </Toaster>
  );
}
export function ElementsCards({ locale }: { locale: Locale }) {
  return (
    <div className="demo-kit-grid demo-kit-grid--2">
      <Card as="article" title={t(locale, "demo.elements.cards.selected")} selected>
        {t(locale, "demo.elements.cards.updated")}
      </Card>
      <Card
        as="article"
        variant="widget"
        title={t(locale, "demo.elements.metrics.title")}
        subtitle={t(locale, "demo.elements.metrics.description")}
      >
        <Kpis locale={locale} />
      </Card>
      <EmptyState
        title={t(locale, "demo.elements.empty.records")}
        body={t(locale, "demo.elements.empty.recordsBody")}
        action={<Button>{t(locale, "demo.elements.empty.add")}</Button>}
      />
    </div>
  );
}
export function ElementsWidgets({ locale }: { locale: Locale }) {
  const now = new Date("2026-10-30T12:00:00Z");
  return (
    <div className="demo-kit-stack">
      <Kpis locale={locale} />
      <div className="demo-kit-grid demo-kit-grid--2">
        <Panel title={t(locale, "demo.elements.metrics.progress")}>
          <Progress label={t(locale, "demo.elements.metrics.target")} value={72} />
        </Panel>
        <Panel className="demo-overview-wide" title={t(locale, "demo.elements.tables.activity")}>
          <ActivityFeed
            label={t(locale, "demo.elements.tables.activity")}
            now={now}
            locale={locale}
            items={[
              {
                id: "one",
                actor: "Sanne Willems",
                action: t(locale, "demo.elements.tables.action1"),
                date: new Date("2026-10-30T09:00:00Z"),
              },
              {
                id: "two",
                actor: "Joris van den Berg",
                action: t(locale, "demo.elements.tables.action2"),
                date: new Date("2026-10-29T15:00:00Z"),
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
