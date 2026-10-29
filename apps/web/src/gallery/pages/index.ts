import type { MessageKey } from "@talentstroom/i18n";
import { Layout } from "./Layout.tsx";
import { Metrics } from "./Metrics.tsx";
import { Charts } from "./Charts.tsx";
import { Tables } from "./Tables.tsx";
import { Filters } from "./Filters.tsx";
import { Forms } from "./Forms.tsx";
import { Overlays } from "./Overlays.tsx";
import { Feedback } from "./Feedback.tsx";
export const pages = [
  { id: "layout", titleKey: "gallery.page.layout" satisfies MessageKey, Page: Layout },
  { id: "metrics", titleKey: "gallery.page.metrics" satisfies MessageKey, Page: Metrics },
  { id: "charts", titleKey: "gallery.page.charts" satisfies MessageKey, Page: Charts },
  { id: "tables", titleKey: "gallery.page.tables" satisfies MessageKey, Page: Tables },
  { id: "filters", titleKey: "gallery.page.filters" satisfies MessageKey, Page: Filters },
  { id: "forms", titleKey: "gallery.page.forms" satisfies MessageKey, Page: Forms },
  { id: "overlays", titleKey: "gallery.page.overlays" satisfies MessageKey, Page: Overlays },
  { id: "feedback", titleKey: "gallery.page.feedback" satisfies MessageKey, Page: Feedback },
] as const;
