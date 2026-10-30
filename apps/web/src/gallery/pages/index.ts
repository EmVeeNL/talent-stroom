import type { MessageKey } from "@talentstroom/i18n";
import { Tokens } from "./Tokens.tsx";
import { Layout } from "./Layout.tsx";
import { Metrics } from "./Metrics.tsx";
import { Charts } from "./Charts.tsx";
import { Tables } from "./Tables.tsx";
import { Filters } from "./Filters.tsx";
import { Forms } from "./Forms.tsx";
import { Overlays } from "./Overlays.tsx";
import { Feedback } from "./Feedback.tsx";
import { Auth } from "./Auth.tsx";
import { Kanban } from "./Kanban.tsx";
export const pages = [
  { id: "tokens", titleKey: "gallery.page.tokens" satisfies MessageKey, Page: Tokens },
  { id: "layout", titleKey: "gallery.page.layout" satisfies MessageKey, Page: Layout },
  { id: "metrics", titleKey: "gallery.page.metrics" satisfies MessageKey, Page: Metrics },
  { id: "charts", titleKey: "gallery.page.charts" satisfies MessageKey, Page: Charts },
  { id: "tables", titleKey: "gallery.page.tables" satisfies MessageKey, Page: Tables },
  { id: "filters", titleKey: "gallery.page.filters" satisfies MessageKey, Page: Filters },
  { id: "forms", titleKey: "gallery.page.forms" satisfies MessageKey, Page: Forms },
  { id: "overlays", titleKey: "gallery.page.overlays" satisfies MessageKey, Page: Overlays },
  { id: "feedback", titleKey: "gallery.page.feedback" satisfies MessageKey, Page: Feedback },
  { id: "auth", titleKey: "gallery.page.auth" satisfies MessageKey, Page: Auth },
  { id: "kanban", titleKey: "gallery.page.kanban" satisfies MessageKey, Page: Kanban },
] as const;
