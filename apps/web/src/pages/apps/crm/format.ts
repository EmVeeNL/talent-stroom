import type { CrmDeal, DealStage } from "../../../demo/apps.ts";

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Whole euros in nl-NL notation, for example "€ 18.500". */
export const formatEuro = (amount: number): string => euro.format(amount);

export const DEAL_TONES: Record<DealStage, "neutral" | "info" | "warning" | "success" | "danger"> = {
  lead: "neutral",
  voorstel: "info",
  onderhandeling: "warning",
  gewonnen: "success",
  verloren: "danger",
};

export const openValue = (deals: readonly CrmDeal[]): number =>
  deals
    .filter((deal) => deal.stage !== "gewonnen" && deal.stage !== "verloren")
    .reduce((sum, deal) => sum + deal.amount, 0);

export const wonValue = (deals: readonly CrmDeal[]): number =>
  deals.filter((deal) => deal.stage === "gewonnen").reduce((sum, deal) => sum + deal.amount, 0);
