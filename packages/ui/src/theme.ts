export type ThemePreference = "system" | "light" | "dark";
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
export function getThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem("ts-theme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}
export function applyThemePreference(preference: ThemePreference): void {
  if (typeof document !== "undefined") {
    if (preference === "system") delete document.documentElement.dataset["theme"];
    else document.documentElement.dataset["theme"] = preference;
  }
}
export function setThemePreference(preference: ThemePreference): void {
  applyThemePreference(preference);
  try {
    localStorage.setItem("ts-theme", preference);
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new CustomEvent<ThemePreference>("ts-theme-change", { detail: preference }));
}
