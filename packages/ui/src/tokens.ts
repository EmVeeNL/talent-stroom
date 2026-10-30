/**
 * Design tokens v1 for TypeScript consumers. `cssVariables` mirrors tokens.css exactly
 * (asserted by tokens.test.ts); grouped exports below are convenience views of it.
 * Source: docs/images/redesign design kit; mapping and contrast deviations in docs/adr/0013-redesign-design-kit.md.
 */
export const cssVariables = {
  // Typography: Asap Sharp, scale from 02-typography.md
  "--font-ui": '"Asap Sharp", "Asap", system-ui, sans-serif',
  "--ts-font-size-xs": "12px",
  "--ts-font-size-sm": "14px",
  "--ts-font-size-md": "14px",
  "--ts-font-size-lg": "16px",
  "--ts-font-size-xl": "18px",
  "--ts-font-size-2xl": "24px",
  "--ts-font-size-3xl": "30px",
  "--ts-font-size-4xl": "36px",
  "--ts-line-height-xs": "16px",
  "--ts-line-height-sm": "20px",
  "--ts-line-height-md": "20px",
  "--ts-line-height-lg": "24px",
  "--ts-line-height-xl": "24px",
  "--ts-line-height-2xl": "32px",
  "--ts-line-height-3xl": "38px",
  "--ts-line-height-4xl": "44px",
  "--ts-line-height-body": "1.5",
  "--ts-line-height-heading": "1.25",
  "--ts-font-weight-regular": "400",
  "--ts-font-weight-medium": "500",
  "--ts-font-weight-semibold": "600",
  "--ts-font-weight-bold": "700",
  "--ts-font-hero": "700 36px/44px var(--font-ui)",
  "--ts-font-page-title": "600 24px/32px var(--font-ui)",
  "--ts-font-section-title": "600 20px/28px var(--font-ui)",
  "--ts-font-card-title": "600 14px/20px var(--font-ui)",
  "--ts-font-body": "400 14px/20px var(--font-ui)",
  "--ts-font-compact": "400 14px/20px var(--font-ui)",
  "--ts-font-section-label": "600 11px/16px var(--font-ui)",
  "--ts-font-caption": "400 12px/16px var(--font-ui)",
  "--ts-font-label": "600 12px/16px var(--font-ui)",

  // Palette: primary (kit primary = 500)
  "--ts-primary-50": "#eef3fe",
  "--ts-primary-100": "#dce6fd",
  "--ts-primary-200": "#bacdfb",
  "--ts-primary-300": "#8eaef9",
  "--ts-primary-400": "#4e82ff",
  "--ts-primary-500": "#245bf4",
  "--ts-primary-600": "#1c4cdb",
  "--ts-primary-700": "#1840b4",
  "--ts-primary-800": "#17378f",
  "--ts-primary-900": "#132c6e",

  // Palette: neutrals (50 = canvas, 100 = subtle, 200 = line, 900 = ink)
  "--ts-neutral-0": "#ffffff",
  "--ts-neutral-50": "#f5f7fb",
  "--ts-neutral-100": "#edf2f9",
  "--ts-neutral-200": "#d8e2ef",
  "--ts-neutral-300": "#bfccdc",
  "--ts-neutral-400": "#9aabc0",
  "--ts-neutral-500": "#7a8ba3",
  "--ts-neutral-600": "#5b6b83",
  "--ts-neutral-700": "#44546c",
  "--ts-neutral-800": "#2a3a52",
  "--ts-neutral-900": "#102038",

  // Palette: navy (dark theme surfaces and the sidebar)
  "--ts-navy-950": "#101725",
  "--ts-navy-900": "#0a1829",
  "--ts-navy-850": "#182131",
  "--ts-navy-800": "#202b3c",
  "--ts-navy-700": "#303b4e",

  // Palette: accent mint/teal
  "--ts-accent-50": "#e4faf7",
  "--ts-accent-100": "#c4f4ee",
  "--ts-accent-300": "#5dddc1",
  "--ts-accent-500": "#2cd3c0",
  "--ts-accent-600": "#0e9f98",
  "--ts-accent-700": "#0a6e73",

  // Semantic: canvas, surfaces, text, borders
  "--ts-bg": "#f5f7fb",
  "--ts-surface": "#ffffff",
  "--ts-surface-muted": "#edf2f9",
  "--ts-surface-raised": "#ffffff",
  "--ts-text": "#102038",
  "--ts-text-muted": "#5b6b83",
  "--ts-border": "#e4e8f0",
  "--ts-border-strong": "#7a8ba3",
  "--ts-disabled-bg": "#edf2f9",
  "--ts-disabled-text": "#7a8ba3",

  // Semantic: actions and status.
  // Solid = fills/icons, -text = readable text on surfaces and -subtle, -subtle = label background.
  "--ts-primary": "#245bf4",
  "--ts-primary-hover": "#1c4cdb",
  "--ts-primary-subtle": "#eaf0fe",
  "--ts-primary-text": "#245bf4",
  "--ts-text-on-primary": "#ffffff",
  "--ts-accent": "#2cd3c0",
  "--ts-accent-subtle": "#e4faf7",
  "--ts-accent-text": "#0a6e73",
  "--ts-success": "#22be9c",
  "--ts-success-subtle": "#ddf5ec",
  "--ts-success-text": "#0b7259",
  "--ts-warning": "#eba43e",
  "--ts-warning-subtle": "#fdebd6",
  "--ts-warning-text": "#8f5408",
  "--ts-danger": "#db3348",
  "--ts-danger-hover": "#be2639",
  "--ts-danger-subtle": "#fbe5e9",
  "--ts-danger-text": "#b4233a",
  "--ts-text-on-danger": "#ffffff",
  "--ts-info": "#245bf4",
  "--ts-info-subtle": "#eaf0fe",
  "--ts-info-text": "#1c4cdb",
  "--ts-violet": "#9772ff",
  "--ts-violet-subtle": "#ece6ff",
  "--ts-violet-text": "#5b37cc",
  "--ts-neutral-subtle": "#e9eef5",
  "--ts-neutral-text": "#3b4a61",

  // Navy sidebar (same in both themes)
  "--ts-sidebar-bg": "#0e1625",
  "--ts-sidebar-text": "#c5d1e0",
  "--ts-sidebar-text-muted": "#8a9cb6",
  "--ts-sidebar-text-active": "#ffffff",
  "--ts-sidebar-hover-bg": "#182438",
  "--ts-sidebar-active-bg": "#1b2e49",
  "--ts-sidebar-border": "#1c3049",
  "--ts-sidebar-accent": "#4e82ff",

  // Radius: controls sm/md 4px, panels lg 6px, dialogs xl 8px
  "--ts-radius-sm": "4px",
  "--ts-radius-md": "4px",
  "--ts-radius-lg": "6px",
  "--ts-radius-xl": "8px",
  "--ts-radius-full": "9999px",

  // Spacing (strict 4px scale; legacy 0-5 name aliases the first step)
  "--ts-space": "4px",
  "--ts-space-0-5": "4px",
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
  "--ts-space-20": "80px",

  // Borders and elevation
  "--ts-border-width": "1px",
  "--ts-shadow-card": "0 1px 2px rgb(16 32 56 / 4%)",
  "--ts-shadow-popover": "0 4px 12px rgb(16 32 56 / 8%)",
  "--ts-shadow-modal": "0 8px 24px rgb(16 32 56 / 10%)",

  // Focus ring
  "--ts-focus-ring-color": "#245bf4",
  "--ts-focus-ring-color-on-dark": "#82aeff",
  "--ts-focus-ring-width": "2px",
  "--ts-focus-ring-offset": "2px",

  // Layout and sizing (breakpoints are reference values; media queries cannot read variables)
  "--ts-breakpoint-mobile": "390px",
  "--ts-breakpoint-tablet": "768px",
  "--ts-breakpoint-desktop": "1024px",
  "--ts-breakpoint-wide": "1440px",
  "--ts-sidebar-width": "240px",
  "--ts-sidebar-width-collapsed": "68px",
  "--ts-navbar-height": "56px",
  "--ts-content-max-width": "1600px",
  "--ts-control-height-sm": "32px",
  "--ts-control-height-md": "36px",
  "--ts-control-height-lg": "36px",

  // Motion
  "--ts-duration-fast": "120ms",
  "--ts-duration-base": "200ms",
} as const;

/** Full resolved dark theme, including the shared palette, typography and sidebar tokens. */
export const darkCssVariables: Record<keyof typeof cssVariables, string> = {
  ...cssVariables,
  "--ts-bg": "#101725",
  "--ts-surface": "#182131",
  "--ts-surface-muted": "#202b3c",
  "--ts-surface-raised": "#202b3c",
  "--ts-text": "#f3f7fc",
  "--ts-text-muted": "#a2b5ca",
  "--ts-border": "#303b4e",
  "--ts-border-strong": "#7b90a8",
  "--ts-disabled-bg": "#202b3c",
  "--ts-disabled-text": "#7b90a8",
  "--ts-primary": "#3369f0",
  "--ts-primary-hover": "#2559e0",
  "--ts-primary-subtle": "#16305e",
  "--ts-primary-text": "#82aeff",
  "--ts-accent": "#5dddc1",
  "--ts-accent-subtle": "#0b3b3b",
  "--ts-accent-text": "#5dddc1",
  "--ts-success": "#43ddb6",
  "--ts-success-subtle": "#0b3b36",
  "--ts-success-text": "#43ddb6",
  "--ts-warning": "#ffbb5a",
  "--ts-warning-subtle": "#4a3115",
  "--ts-warning-text": "#ffbb5a",
  "--ts-danger": "#db3348",
  "--ts-danger-hover": "#be2639",
  "--ts-danger-subtle": "#4a1a2b",
  "--ts-danger-text": "#ff6575",
  "--ts-info": "#3369f0",
  "--ts-info-subtle": "#16305e",
  "--ts-info-text": "#82aeff",
  "--ts-violet": "#9772ff",
  "--ts-violet-subtle": "#2a2166",
  "--ts-violet-text": "#c3b1ff",
  "--ts-neutral-subtle": "#22384f",
  "--ts-neutral-text": "#c9d5e5",
  "--ts-shadow-card": "none",
  "--ts-shadow-popover": "none",
  "--ts-shadow-modal": "none",
  "--ts-focus-ring-color": "#82aeff",
};

export type CssVariableName = keyof typeof cssVariables;

const v = cssVariables;

/** Light-theme core colours (kit names in comments: canvas, panel, ink, line, brand). */
export const colors = {
  background: v["--ts-bg"],
  surface: v["--ts-surface"],
  surfaceMuted: v["--ts-surface-muted"],
  text: v["--ts-text"],
  mutedText: v["--ts-text-muted"],
  border: v["--ts-border"],
  primary: v["--ts-primary"],
  primaryHover: v["--ts-primary-hover"],
  accent: v["--ts-accent"],
  success: v["--ts-success"],
  warning: v["--ts-warning"],
  danger: v["--ts-danger"],
  violet: v["--ts-violet"],
} as const;

export const semanticColors = {
  surfaceRaised: v["--ts-surface-raised"],
  textOnPrimary: v["--ts-text-on-primary"],
  textOnDanger: v["--ts-text-on-danger"],
  borderStrong: v["--ts-border-strong"],
  primarySubtle: v["--ts-primary-subtle"],
  primaryText: v["--ts-primary-text"],
  accentSubtle: v["--ts-accent-subtle"],
  accentText: v["--ts-accent-text"],
  dangerHover: v["--ts-danger-hover"],
  dangerSubtle: v["--ts-danger-subtle"],
  dangerText: v["--ts-danger-text"],
  successSubtle: v["--ts-success-subtle"],
  successText: v["--ts-success-text"],
  warningSubtle: v["--ts-warning-subtle"],
  warningText: v["--ts-warning-text"],
  infoSubtle: v["--ts-info-subtle"],
  infoText: v["--ts-info-text"],
  violetSubtle: v["--ts-violet-subtle"],
  violetText: v["--ts-violet-text"],
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

/** Raw palette scales (theme-independent). */
export const palette = {
  primary: {
    50: v["--ts-primary-50"],
    100: v["--ts-primary-100"],
    200: v["--ts-primary-200"],
    300: v["--ts-primary-300"],
    400: v["--ts-primary-400"],
    500: v["--ts-primary-500"],
    600: v["--ts-primary-600"],
    700: v["--ts-primary-700"],
    800: v["--ts-primary-800"],
    900: v["--ts-primary-900"],
  },
  neutral: {
    0: v["--ts-neutral-0"],
    50: v["--ts-neutral-50"],
    100: v["--ts-neutral-100"],
    200: v["--ts-neutral-200"],
    300: v["--ts-neutral-300"],
    400: v["--ts-neutral-400"],
    500: v["--ts-neutral-500"],
    600: v["--ts-neutral-600"],
    700: v["--ts-neutral-700"],
    800: v["--ts-neutral-800"],
    900: v["--ts-neutral-900"],
  },
  navy: {
    700: v["--ts-navy-700"],
    800: v["--ts-navy-800"],
    850: v["--ts-navy-850"],
    900: v["--ts-navy-900"],
    950: v["--ts-navy-950"],
  },
  accent: {
    50: v["--ts-accent-50"],
    100: v["--ts-accent-100"],
    300: v["--ts-accent-300"],
    500: v["--ts-accent-500"],
    600: v["--ts-accent-600"],
    700: v["--ts-accent-700"],
  },
} as const;

export const radius = { sm: 4, md: 4, lg: 6, xl: 8, full: 9999 } as const;

export const spacingBasePx = 4;
export const spacing = {
  "0-5": 4,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export const fontSize = { xs: 12, sm: 14, md: 14, lg: 16, xl: 18, "2xl": 24, "3xl": 30, "4xl": 36 } as const;
export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
export const lineHeight = { body: 1.5, heading: 1.25 } as const;
export const lineHeightPx = { xs: 16, sm: 20, md: 20, lg: 24, xl: 24, "2xl": 32, "3xl": 38, "4xl": 44 } as const;

/** Typographic roles from 02-typography.md: size/line-height in px and weight. */
export const typeScale = {
  hero: { variable: "--ts-font-hero", size: 36, lineHeight: 44, weight: 700 },
  pageTitle: { variable: "--ts-font-page-title", size: 24, lineHeight: 32, weight: 600 },
  sectionTitle: { variable: "--ts-font-section-title", size: 20, lineHeight: 28, weight: 600 },
  cardTitle: { variable: "--ts-font-card-title", size: 14, lineHeight: 20, weight: 600 },
  body: { variable: "--ts-font-body", size: 14, lineHeight: 20, weight: 400 },
  compact: { variable: "--ts-font-compact", size: 14, lineHeight: 20, weight: 400 },
  caption: { variable: "--ts-font-caption", size: 12, lineHeight: 16, weight: 400 },
  label: { variable: "--ts-font-label", size: 12, lineHeight: 16, weight: 600 },
} as const satisfies Record<string, { variable: CssVariableName; size: number; lineHeight: number; weight: number }>;

export const shadows = {
  card: "--ts-shadow-card",
  popover: "--ts-shadow-popover",
  modal: "--ts-shadow-modal",
} as const satisfies Record<string, CssVariableName>;

export const breakpoints = { mobile: 390, tablet: 768, desktop: 1024, wide: 1440 } as const;
export const layout = {
  sidebarWidth: 240,
  sidebarWidthCollapsed: 68,
  navbarHeight: 56,
  contentMaxWidth: 1600,
} as const;
