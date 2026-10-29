import {
  breakpoints,
  contrastRatio,
  cssVariables,
  darkCssVariables,
  layout,
  palette,
  radius,
  spacing,
  typeScale,
} from "@talentstroom/ui";
import type { CssVariableName } from "@talentstroom/ui";
import type { MessageKey } from "@talentstroom/i18n";
import { Section } from "../Section.tsx";
import { useGallery } from "../context.ts";

type Theme = Record<CssVariableName, string>;
/** fill: text `fg` on `token`; text: `token` as text on `on`; ui: `token` as a line/indicator on `on`. */
type Swatch =
  | { kind: "fill"; token: CssVariableName; fg: CssVariableName }
  | { kind: "text" | "ui"; token: CssVariableName; on: CssVariableName };

const tones = ["success", "warning", "danger", "info", "violet", "accent"] as const;

const groups: { key: MessageKey; swatches: Swatch[] }[] = [
  {
    key: "gallery.tokens.group.surfaces",
    swatches: [
      { kind: "fill", token: "--ts-bg", fg: "--ts-text" },
      { kind: "fill", token: "--ts-surface", fg: "--ts-text" },
      { kind: "fill", token: "--ts-surface-muted", fg: "--ts-text-muted" },
      { kind: "fill", token: "--ts-surface-raised", fg: "--ts-text" },
      { kind: "text", token: "--ts-text-muted", on: "--ts-surface" },
      { kind: "ui", token: "--ts-border", on: "--ts-surface" },
      { kind: "ui", token: "--ts-border-strong", on: "--ts-surface" },
    ],
  },
  {
    key: "gallery.tokens.group.actions",
    swatches: [
      { kind: "fill", token: "--ts-primary", fg: "--ts-text-on-primary" },
      { kind: "fill", token: "--ts-primary-hover", fg: "--ts-text-on-primary" },
      { kind: "fill", token: "--ts-primary-subtle", fg: "--ts-primary-text" },
      { kind: "text", token: "--ts-primary-text", on: "--ts-surface" },
      { kind: "fill", token: "--ts-danger", fg: "--ts-text-on-danger" },
      { kind: "ui", token: "--ts-focus-ring-color", on: "--ts-surface" },
    ],
  },
  {
    key: "gallery.tokens.group.status",
    swatches: [
      ...tones.flatMap((tone): Swatch[] => [
        { kind: "fill", token: `--ts-${tone}-subtle`, fg: `--ts-${tone}-text` },
        { kind: "ui", token: `--ts-${tone}`, on: "--ts-surface" },
      ]),
      { kind: "fill", token: "--ts-neutral-subtle", fg: "--ts-neutral-text" },
    ],
  },
  {
    key: "gallery.tokens.group.sidebar",
    swatches: [
      { kind: "fill", token: "--ts-sidebar-bg", fg: "--ts-sidebar-text" },
      { kind: "fill", token: "--ts-sidebar-bg", fg: "--ts-sidebar-text-muted" },
      { kind: "fill", token: "--ts-sidebar-hover-bg", fg: "--ts-sidebar-text" },
      { kind: "fill", token: "--ts-sidebar-active-bg", fg: "--ts-sidebar-text-active" },
      { kind: "ui", token: "--ts-sidebar-accent", on: "--ts-sidebar-bg" },
      { kind: "ui", token: "--ts-focus-ring-color-on-dark", on: "--ts-sidebar-bg" },
    ],
  },
];

const short = (name: string) => name.replace(/^--ts-/, "");

function useRatio() {
  const { tr, locale } = useGallery();
  const format = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (ratio: number, minimum: number) => {
    const level: MessageKey =
      ratio >= 4.5
        ? "gallery.tokens.level.text"
        : ratio >= 3
          ? "gallery.tokens.level.ui"
          : "gallery.tokens.level.decorative";
    return { text: `${format.format(ratio)}:1`, level: tr(level), pass: ratio >= minimum };
  };
}

function SwatchTile({ swatch, theme }: { swatch: Swatch; theme: Theme }) {
  const { tr } = useGallery();
  const rate = useRatio();
  const background = swatch.kind === "fill" ? theme[swatch.token] : theme[swatch.on];
  const foreground = swatch.kind === "fill" ? theme[swatch.fg] : theme[swatch.token];
  const pairName = swatch.kind === "fill" ? swatch.fg : swatch.on;
  const ratio = rate(contrastRatio(foreground, background), swatch.kind === "ui" ? 3 : 4.5);
  return (
    <li className="gallery-swatch" style={{ borderColor: theme["--ts-border"], background: theme["--ts-surface"] }}>
      <div
        className={`gallery-swatch__chip gallery-swatch__chip--${swatch.kind}`}
        style={{ background, color: foreground, borderColor: swatch.kind === "ui" ? foreground : background }}
        aria-hidden="true"
      >
        {swatch.kind === "ui" ? null : "Aa"}
      </div>
      <div className="gallery-swatch__meta" style={{ color: theme["--ts-text"] }}>
        <code>{short(swatch.token)}</code>
        <span style={{ color: theme["--ts-text-muted"] }}>
          {theme[swatch.token].toUpperCase()} · {tr("gallery.tokens.on")} {short(pairName)}
        </span>
        <span className="ts-tabular-nums">
          <strong>{ratio.text}</strong>{" "}
          <span style={{ color: theme[ratio.pass ? "--ts-text-muted" : "--ts-warning-text"] }}>{ratio.level}</span>
        </span>
      </div>
    </li>
  );
}

function ThemePanel({ titleKey, theme }: { titleKey: MessageKey; theme: Theme }) {
  const { tr } = useGallery();
  return (
    <section
      className="gallery-theme-panel"
      style={{ background: theme["--ts-bg"], color: theme["--ts-text"], borderColor: theme["--ts-border"] }}
    >
      <h3>{tr(titleKey)}</h3>
      {groups.map((group) => (
        <div key={group.key}>
          <h4 style={{ color: theme["--ts-text-muted"] }}>{tr(group.key)}</h4>
          <ul className="gallery-swatches">
            {group.swatches.map((swatch) => (
              <SwatchTile
                key={`${swatch.token}-${swatch.kind === "fill" ? swatch.fg : swatch.on}`}
                swatch={swatch}
                theme={theme}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function PaletteRow({ name, scale }: { name: string; scale: Record<number, string> }) {
  const rate = useRatio();
  const white = palette.neutral[0];
  const ink = palette.neutral[900];
  return (
    <div className="gallery-palette__row">
      <h3>{name}</h3>
      <ul className="gallery-palette__scale">
        {Object.entries(scale).map(([step, hex]) => {
          const fg = contrastRatio(white, hex) >= contrastRatio(ink, hex) ? white : ink;
          const ratio = rate(contrastRatio(fg, hex), 4.5);
          return (
            <li key={step}>
              <div className="gallery-palette__chip" style={{ background: hex, color: fg }}>
                <span className="ts-tabular-nums">{ratio.text}</span>
              </div>
              <code>
                {name}-{step}
              </code>
              <span>{hex.toUpperCase()}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const roleKeys: Record<keyof typeof typeScale, MessageKey> = {
  hero: "gallery.tokens.role.hero",
  pageTitle: "gallery.tokens.role.pageTitle",
  sectionTitle: "gallery.tokens.role.sectionTitle",
  cardTitle: "gallery.tokens.role.cardTitle",
  body: "gallery.tokens.role.body",
  compact: "gallery.tokens.role.compact",
  caption: "gallery.tokens.role.caption",
  label: "gallery.tokens.role.label",
};

const roles = ["hero", "pageTitle", "sectionTitle", "cardTitle", "body", "compact", "caption", "label"] as const;
const radii = ["sm", "md", "lg", "xl", "full"] as const;

const radiusKeys: Record<keyof typeof radius, MessageKey> = {
  sm: "gallery.tokens.radius.sm",
  md: "gallery.tokens.radius.md",
  lg: "gallery.tokens.radius.lg",
  xl: "gallery.tokens.radius.xl",
  full: "gallery.tokens.radius.full",
};

const shadowKeys = [
  ["--ts-shadow-card", "gallery.tokens.shadow.card", "--ts-radius-lg", "--ts-surface"],
  ["--ts-shadow-popover", "gallery.tokens.shadow.popover", "--ts-radius-md", "--ts-surface-raised"],
  ["--ts-shadow-modal", "gallery.tokens.shadow.modal", "--ts-radius-xl", "--ts-surface-raised"],
] as const satisfies readonly (readonly [CssVariableName, MessageKey, CssVariableName, CssVariableName])[];

export function Tokens() {
  const { tr, locale } = useGallery();
  const number = new Intl.NumberFormat(locale);
  const px = { format: (value: number) => `${number.format(value)} px` };
  return (
    <>
      <Section title={tr("gallery.tokens.palette")}>
        <p className="gallery-overlay-intro">{tr("gallery.tokens.paletteHint")}</p>
        <div className="gallery-palette">
          <PaletteRow name="primary" scale={palette.primary} />
          <PaletteRow name="neutral" scale={palette.neutral} />
          <PaletteRow name="navy" scale={palette.navy} />
          <PaletteRow name="accent" scale={palette.accent} />
        </div>
      </Section>

      <Section title={tr("gallery.tokens.semantic")}>
        <p className="gallery-overlay-intro">{tr("gallery.tokens.semanticHint")}</p>
        <div className="gallery-theme-panels">
          <ThemePanel titleKey="gallery.tokens.light" theme={cssVariables} />
          <ThemePanel titleKey="gallery.tokens.dark" theme={darkCssVariables} />
        </div>
      </Section>

      <Section title={tr("gallery.tokens.typography")}>
        <dl className="gallery-type">
          {roles.map((role) => {
            const spec = typeScale[role];
            return (
              <div key={role} className="gallery-type__row">
                <dt>
                  <strong>{tr(roleKeys[role])}</strong>
                  <span className="ts-tabular-nums">
                    {spec.size}/{spec.lineHeight} · {spec.weight}
                  </span>
                  <code>{short(spec.variable)}</code>
                </dt>
                <dd style={{ font: `var(${spec.variable})` }}>{tr("gallery.tokens.sample")}</dd>
              </div>
            );
          })}
          <div className="gallery-type__row">
            <dt>
              <strong>{tr("gallery.tokens.tabular")}</strong>
              <code>ts-tabular-nums</code>
            </dt>
            <dd className="ts-tabular-nums" style={{ font: "var(--ts-font-section-title)" }}>
              1.248 · 86 · 34 · € 128.450
            </dd>
          </div>
        </dl>
      </Section>

      <Section title={tr("gallery.tokens.spacing")}>
        <ul className="gallery-spacing">
          {Object.entries(spacing)
            .toSorted(([, a], [, b]) => a - b)
            .map(([step, value]) => (
              <li key={step}>
                <code>space-{step}</code>
                <span className="gallery-spacing__bar" style={{ width: `var(--ts-space-${step})` }} />
                <span className="ts-tabular-nums">{px.format(value)}</span>
              </li>
            ))}
        </ul>
      </Section>

      <Section title={tr("gallery.tokens.radius")}>
        <ul className="gallery-radius">
          {radii.map((name) => (
            <li key={name}>
              <span className="gallery-radius__box" style={{ borderRadius: `var(--ts-radius-${name})` }} />
              <code>radius-{name}</code>
              <span className="ts-tabular-nums">
                {name === "full" ? "9999" : px.format(radius[name])} · {tr(radiusKeys[name])}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={tr("gallery.tokens.shadows")}>
        <p className="gallery-overlay-intro">{tr("gallery.tokens.shadowsHint")}</p>
        <div className="gallery-theme-panels">
          {(
            [
              ["gallery.tokens.light", cssVariables],
              ["gallery.tokens.dark", darkCssVariables],
            ] as const
          ).map(([titleKey, theme]) => (
            <div
              key={titleKey}
              className="gallery-shadows"
              style={{ background: theme["--ts-bg"], color: theme["--ts-text"], borderColor: theme["--ts-border"] }}
            >
              {shadowKeys.map(([shadow, label, corner, surface]) => (
                <div
                  key={shadow}
                  className="gallery-shadows__item"
                  style={{
                    boxShadow: theme[shadow],
                    borderRadius: theme[corner],
                    background: theme[surface],
                    borderColor: theme["--ts-border"],
                  }}
                >
                  <strong>{tr(label)}</strong>
                  <code style={{ color: theme["--ts-text-muted"] }}>{short(shadow)}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <Section title={tr("gallery.tokens.layout")}>
        <dl className="gallery-layout-list">
          {(
            [
              ["gallery.tokens.layout.sidebar", layout.sidebarWidth, "sidebar-width"],
              ["gallery.tokens.layout.sidebarCollapsed", layout.sidebarWidthCollapsed, "sidebar-width-collapsed"],
              ["gallery.tokens.layout.navbar", layout.navbarHeight, "navbar-height"],
              ["gallery.tokens.layout.content", layout.contentMaxWidth, "content-max-width"],
              ["gallery.tokens.breakpoint.mobile", breakpoints.mobile, "breakpoint-mobile"],
              ["gallery.tokens.breakpoint.tablet", breakpoints.tablet, "breakpoint-tablet"],
              ["gallery.tokens.breakpoint.desktop", breakpoints.desktop, "breakpoint-desktop"],
              ["gallery.tokens.breakpoint.wide", breakpoints.wide, "breakpoint-wide"],
            ] as const satisfies readonly (readonly [MessageKey, number, string])[]
          ).map(([label, value, token]) => (
            <div key={token}>
              <dt>{tr(label)}</dt>
              <dd>
                <strong className="ts-tabular-nums">{px.format(value)}</strong> <code>{token}</code>
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
