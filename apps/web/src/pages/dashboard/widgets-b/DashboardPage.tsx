import type { ReactNode } from "react";
import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
const demoKeys = {
  "attendance.absent": "demo.dashb.attendance.absent",
  "attendance.absentLabel": "demo.dashb.attendance.absentLabel",
  "attendance.appointment": "demo.dashb.attendance.appointment",
  "attendance.approve": "demo.dashb.attendance.approve",
  "attendance.approved": "demo.dashb.attendance.approved",
  "attendance.days": "demo.dashb.attendance.days",
  "attendance.denied": "demo.dashb.attendance.denied",
  "attendance.deny": "demo.dashb.attendance.deny",
  "attendance.late": "demo.dashb.attendance.late",
  "attendance.legend": "demo.dashb.attendance.legend",
  "attendance.leave": "demo.dashb.attendance.leave",
  "attendance.pending": "demo.dashb.attendance.pending",
  "attendance.person": "demo.dashb.attendance.person",
  "attendance.present": "demo.dashb.attendance.present",
  "attendance.presentLabel": "demo.dashb.attendance.presentLabel",
  "attendance.reason": "demo.dashb.attendance.reason",
  "attendance.remote": "demo.dashb.attendance.remote",
  "attendance.remoteLabel": "demo.dashb.attendance.remoteLabel",
  "attendance.status": "demo.dashb.attendance.status",
  "attendance.subtitle": "demo.dashb.attendance.subtitle",
  "attendance.time": "demo.dashb.attendance.time",
  "attendance.vacation": "demo.dashb.attendance.vacation",
  "attendance.week": "demo.dashb.attendance.week",
  "attendance.weekDates": "demo.dashb.attendance.weekDates",
  "attendance.weekRange": "demo.dashb.attendance.weekRange",
  "common.amount": "demo.dashb.common.amount",
  "common.month": "demo.dashb.common.month",
  "deals.close": "demo.dashb.deals.close",
  "deals.company": "demo.dashb.deals.company",
  "deals.forecast": "demo.dashb.deals.forecast",
  "deals.forecastNote": "demo.dashb.deals.forecastNote",
  "deals.forecastRate": "demo.dashb.deals.forecastRate",
  "deals.lostLabel": "demo.dashb.deals.lostLabel",
  "deals.months": "demo.dashb.deals.months",
  "deals.name": "demo.dashb.deals.name",
  "deals.negotiation": "demo.dashb.deals.negotiation",
  "deals.open": "demo.dashb.deals.open",
  "deals.pipeline": "demo.dashb.deals.pipeline",
  "deals.proposal": "demo.dashb.deals.proposal",
  "deals.stage": "demo.dashb.deals.stage",
  "deals.stages": "demo.dashb.deals.stages",
  "deals.subtitle": "demo.dashb.deals.subtitle",
  "deals.top": "demo.dashb.deals.top",
  "deals.trend": "demo.dashb.deals.trend",
  "deals.value": "demo.dashb.deals.value",
  "deals.winrate": "demo.dashb.deals.winrate",
  "deals.won": "demo.dashb.deals.won",
  "deals.wonLabel": "demo.dashb.deals.wonLabel",
  "leads.campaign": "demo.dashb.leads.campaign",
  "leads.company": "demo.dashb.leads.company",
  "leads.contacted": "demo.dashb.leads.contacted",
  "leads.customer": "demo.dashb.leads.customer",
  "leads.due": "demo.dashb.leads.due",
  "leads.event": "demo.dashb.leads.event",
  "leads.followups": "demo.dashb.leads.followups",
  "leads.funnel": "demo.dashb.leads.funnel",
  "leads.name": "demo.dashb.leads.name",
  "leads.new": "demo.dashb.leads.new",
  "leads.newStatus": "demo.dashb.leads.newStatus",
  "leads.owner": "demo.dashb.leads.owner",
  "leads.qualified": "demo.dashb.leads.qualified",
  "leads.referral": "demo.dashb.leads.referral",
  "leads.score": "demo.dashb.leads.score",
  "leads.source": "demo.dashb.leads.source",
  "leads.sources": "demo.dashb.leads.sources",
  "leads.status": "demo.dashb.leads.status",
  "leads.steps": "demo.dashb.leads.steps",
  "leads.subtitle": "demo.dashb.leads.subtitle",
  "leads.today": "demo.dashb.leads.today",
  "leads.tomorrow": "demo.dashb.leads.tomorrow",
  "leads.web": "demo.dashb.leads.web",
  "payroll.amount": "demo.dashb.payroll.amount",
  "payroll.costs": "demo.dashb.payroll.costs",
  "payroll.date1": "demo.dashb.payroll.date1",
  "payroll.date2": "demo.dashb.payroll.date2",
  "payroll.date3": "demo.dashb.payroll.date3",
  "payroll.department": "demo.dashb.payroll.department",
  "payroll.employee": "demo.dashb.payroll.employee",
  "payroll.employeeCount": "demo.dashb.payroll.employeeCount",
  "payroll.finance": "demo.dashb.payroll.finance",
  "payroll.gross": "demo.dashb.payroll.gross",
  "payroll.iban": "demo.dashb.payroll.iban",
  "payroll.net": "demo.dashb.payroll.net",
  "payroll.operations": "demo.dashb.payroll.operations",
  "payroll.payments": "demo.dashb.payroll.payments",
  "payroll.payslips": "demo.dashb.payroll.payslips",
  "payroll.period": "demo.dashb.payroll.period",
  "payroll.periodValue": "demo.dashb.payroll.periodValue",
  "payroll.ready": "demo.dashb.payroll.ready",
  "payroll.recruitment": "demo.dashb.payroll.recruitment",
  "payroll.run": "demo.dashb.payroll.run",
  "payroll.subtitle": "demo.dashb.payroll.subtitle",
} as const satisfies Record<string, MessageKey>;
export function label(locale: Locale, key: string) {
  const entry = Object.entries(demoKeys).find(([suffix]) => suffix === key);
  return entry ? t(locale, entry[1]) : key;
}
export function DashboardPage({
  locale,
  area,
  title,
  children,
}: {
  locale: Locale;
  area: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.dashboard") }, { label: title }]}
      />
      <PageHeader title={title} subtitle={label(locale, `${area}.subtitle`)} />
      {children}
    </>
  );
}
export function money(value: number) {
  return `€ ${value.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}`;
}
