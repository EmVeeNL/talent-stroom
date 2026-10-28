/** Design tokens for TypeScript consumers. Keep in sync with tokens.css. */
export const colors = {
  sidebar: "#111827",
  surface: "#FFFFFF",
  background: "#F5F7FB",
  primary: "#4F59F7",
  primaryHover: "#3E48D4",
  accentMint: "#5DDDC1",
  success: "#158365",
  warning: "#BD7B20",
  danger: "#C63E55",
  text: "#172137",
  mutedText: "#68748A",
  border: "#E5E9F1",
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 20 } as const;

export const spacingBasePx = 4;
