/**
 * Design tokens for TypeScript consumers. `cssVariables` mirrors tokens.css exactly
 * (asserted by tokens.test.ts); grouped exports below are convenience views of it.
 * Source: docs/images/tokens/design-tokens.json, with contrast fixes documented in README.md.
 */
export const cssVariables = {
  // Typography
  "--font-ui": '"Asap Sharp", "Asap", system-ui, sans-serif',
  "--ts-font-size-xs": "12px",
  "--ts-font-size-sm": "14px",
  "--ts-font-size-md": "16px",
  "--ts-font-size-lg": "20px",
  "--ts-font-size-xl": "24px",
  "--ts-font-size-2xl": "32px",
  "--ts-line-height-body": "1.5",
  "--ts-line-height-heading": "1.25",
  "--ts-font-weight-regular": "400",
  "--ts-font-weight-medium": "500",
  "--ts-font-weight-semibold": "600",
  "--ts-font-weight-bold": "700",

  // Brand palette (raw)
  "--ts-sidebar": "#111827",
  "--ts-surface": "#ffffff",
  "--ts-bg": "#f5f7fb",
  "--ts-primary": "#4f59f7",
  "--ts-primary-hover": "#3e48d4",
  "--ts-mint": "#5dddc1",
  "--ts-success": "#158365",
  "--ts-warning": "#bd7b20",
  "--ts-danger": "#c63e55",
  "--ts-text": "#172137",
  "--ts-text-muted": "#5b677d",
  "--ts-border": "#e5e9f1",

  // Semantic: text, surfaces, borders
  "--ts-text-on-primary": "#ffffff",
  "--ts-text-on-danger": "#ffffff",
  "--ts-surface-muted": "#eef1f6",
  "--ts-border-strong": "#7c879b",
  "--ts-disabled-bg": "#e5e9f1",
  "--ts-disabled-text": "#68748a",

  // Semantic: actions and status (solid = fills and icons, text = readable on subtle background)
  "--ts-primary-subtle": "#eef0ff",
  "--ts-primary-text": "#3e48d4",
  "--ts-danger-hover": "#a82f45",
  "--ts-danger-subtle": "#fcebee",
  "--ts-danger-text": "#a82f45",
  "--ts-success-subtle": "#e6f6f1",
  "--ts-success-text": "#0f6b52",
  "--ts-warning-subtle": "#fcf3e3",
  "--ts-warning-text": "#8a5410",
  "--ts-info": "#4f59f7",
  "--ts-info-subtle": "#eef0ff",
  "--ts-info-text": "#3e48d4",
  "--ts-neutral-subtle": "#eef1f6",
  "--ts-neutral-text": "#3d495f",

  // Dark sidebar
  "--ts-sidebar-bg": "#111827",
  "--ts-sidebar-text": "#c5ccda",
  "--ts-sidebar-text-muted": "#9aa5b8",
  "--ts-sidebar-text-active": "#ffffff",
  "--ts-sidebar-hover-bg": "#1c2535",
  "--ts-sidebar-active-bg": "#262f5c",
  "--ts-sidebar-border": "#263044",
  "--ts-sidebar-accent": "#5dddc1",

  // Radius
  "--ts-radius-sm": "6px",
  "--ts-radius-md": "10px",
  "--ts-radius-lg": "16px",
  "--ts-radius-xl": "20px",
  "--ts-radius-full": "9999px",

  // Spacing (4px base)
  "--ts-space": "4px",
  "--ts-space-1": "4px",
  "--ts-space-2": "8px",
  "--ts-space-3": "12px",
  "--ts-space-4": "16px",
  "--ts-space-5": "20px",
  "--ts-space-6": "24px",
  "--ts-space-8": "32px",
  "--ts-space-10": "40px",
  "--ts-space-12": "48px",
  "--ts-space-16": "64px",

  // Shadows
  "--ts-shadow-sm": "0 1px 2px rgb(23 33 55 / 8%)",
  "--ts-shadow-md": "0 4px 12px rgb(23 33 55 / 10%)",
  "--ts-shadow-lg": "0 12px 32px rgb(23 33 55 / 14%)",

  // Focus ring
  "--ts-focus-ring-color": "#4f59f7",
  "--ts-focus-ring-color-on-dark": "#5dddc1",
  "--ts-focus-ring-width": "2px",
  "--ts-focus-ring-offset": "2px",

  // Motion
  "--ts-duration-fast": "120ms",
  "--ts-duration-base": "200ms",
} as const;

/** Full resolved dark theme, including the shared typography and sidebar tokens. */
export const darkCssVariables: Record<keyof typeof cssVariables, string> = {
  ...cssVariables,
  "--ts-surface": "#1c2535",
  "--ts-bg": "#111827",
  "--ts-surface-muted": "#263044",
  "--ts-text": "#f3f5fb",
  "--ts-text-muted": "#b4bfd2",
  "--ts-border": "#38445a",
  "--ts-border-strong": "#8491a8",
  "--ts-primary": "#a0a7ff",
  "--ts-primary-hover": "#bcc1ff",
  "--ts-text-on-primary": "#111827",
  "--ts-primary-subtle": "#262f5c",
  "--ts-primary-text": "#bcc1ff",
  "--ts-danger": "#f08095",
  "--ts-danger-hover": "#ffa0af",
  "--ts-text-on-danger": "#111827",
  "--ts-danger-subtle": "#482535",
  "--ts-danger-text": "#ffa0af",
  "--ts-success": "#5dddc1",
  "--ts-success-subtle": "#173e38",
  "--ts-success-text": "#77e5ce",
  "--ts-warning": "#edbd70",
  "--ts-warning-subtle": "#42351f",
  "--ts-warning-text": "#f4cc8b",
  "--ts-info": "#a0a7ff",
  "--ts-info-subtle": "#262f5c",
  "--ts-info-text": "#bcc1ff",
  "--ts-neutral-subtle": "#263044",
  "--ts-neutral-text": "#d5deed",
  "--ts-disabled-bg": "#263044",
  "--ts-disabled-text": "#8491a8",
  "--ts-focus-ring-color": "#a0a7ff",
};

export type CssVariableName = keyof typeof cssVariables;

const v = cssVariables;

export const colors = {
  sidebar: v["--ts-sidebar"],
  surface: v["--ts-surface"],
  background: v["--ts-bg"],
  primary: v["--ts-primary"],
  primaryHover: v["--ts-primary-hover"],
  accentMint: v["--ts-mint"],
  success: v["--ts-success"],
  warning: v["--ts-warning"],
  danger: v["--ts-danger"],
  text: v["--ts-text"],
  mutedText: v["--ts-text-muted"],
  border: v["--ts-border"],
} as const;

export const semanticColors = {
  textOnPrimary: v["--ts-text-on-primary"],
  textOnDanger: v["--ts-text-on-danger"],
  surfaceMuted: v["--ts-surface-muted"],
  borderStrong: v["--ts-border-strong"],
  primarySubtle: v["--ts-primary-subtle"],
  primaryText: v["--ts-primary-text"],
  dangerHover: v["--ts-danger-hover"],
  dangerSubtle: v["--ts-danger-subtle"],
  dangerText: v["--ts-danger-text"],
  successSubtle: v["--ts-success-subtle"],
  successText: v["--ts-success-text"],
  warningSubtle: v["--ts-warning-subtle"],
  warningText: v["--ts-warning-text"],
  infoSubtle: v["--ts-info-subtle"],
  infoText: v["--ts-info-text"],
  neutralSubtle: v["--ts-neutral-subtle"],
  neutralText: v["--ts-neutral-text"],
  focusRing: v["--ts-focus-ring-color"],
} as const;

export const sidebarColors = {
  background: v["--ts-sidebar-bg"],
  text: v["--ts-sidebar-text"],
  textMuted: v["--ts-sidebar-text-muted"],
  textActive: v["--ts-sidebar-text-active"],
  hoverBackground: v["--ts-sidebar-hover-bg"],
  activeBackground: v["--ts-sidebar-active-bg"],
  border: v["--ts-sidebar-border"],
  accent: v["--ts-sidebar-accent"],
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 20 } as const;

export const spacingBasePx = 4;
export const spacing = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const fontSize = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, "2xl": 32 } as const;
export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export const lineHeight = { body: 1.5, heading: 1.25 } as const;
