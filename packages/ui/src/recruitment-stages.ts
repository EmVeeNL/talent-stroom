import type { IconName } from "./icons.ts";

export const RECRUITMENT_STAGE_IDS = [
  "nieuw",
  "in_behandeling",
  "gesprek",
  "aanbod",
  "geplaatst",
  "niet_geschikt",
  "talentpool",
] as const;

export type RecruitmentStageId = (typeof RECRUITMENT_STAGE_IDS)[number];
export type RecruitmentStageTone =
  | "info"
  | "warning"
  | "violet"
  | "accent"
  | "success"
  | "danger"
  | "neutral"
  | "custom";

export const RECRUITMENT_STAGES = {
  nieuw: {
    labelKey: { nl: "recruitment.stage.nieuw", en: "recruitment.stage.nieuw" },
    tone: "info",
    icon: "person_search",
  },
  in_behandeling: {
    labelKey: { nl: "recruitment.stage.in_behandeling", en: "recruitment.stage.in_behandeling" },
    tone: "warning",
    icon: "schedule",
  },
  gesprek: {
    labelKey: { nl: "recruitment.stage.gesprek", en: "recruitment.stage.gesprek" },
    tone: "violet",
    icon: "handshake",
  },
  aanbod: {
    labelKey: { nl: "recruitment.stage.aanbod", en: "recruitment.stage.aanbod" },
    tone: "accent",
    icon: "send",
  },
  geplaatst: {
    labelKey: { nl: "recruitment.stage.geplaatst", en: "recruitment.stage.geplaatst" },
    tone: "success",
    icon: "task_alt",
  },
  niet_geschikt: {
    labelKey: { nl: "recruitment.stage.niet_geschikt", en: "recruitment.stage.niet_geschikt" },
    tone: "danger",
    icon: "error",
  },
  talentpool: {
    labelKey: { nl: "recruitment.stage.talentpool", en: "recruitment.stage.talentpool" },
    tone: "neutral",
    icon: "groups",
  },
} as const satisfies Record<
  RecruitmentStageId,
  { labelKey: { nl: string; en: string }; tone: RecruitmentStageTone; icon: IconName }
>;

/** Used for user-created status labels that do not map to a pipeline stage. */
export const CUSTOM_LABEL_TONE: RecruitmentStageTone = "custom";
