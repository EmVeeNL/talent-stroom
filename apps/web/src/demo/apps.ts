/**
 * Synthetic demo data for the app pages (Agenda, Chat, Kanbanbord, CRM, Notities, Contacten).
 * Fictional people and companies only; deterministic and based on a fixed "today".
 */

export const DEMO_TODAY = "2026-10-30";

/* ------------------------------------------------------------------ Agenda */

export type AgendaEventType = "gesprek" | "intake" | "deadline";

export interface AgendaEvent {
  id: string;
  title: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** 24h time; omitted for all-day events such as deadlines. */
  start?: string;
  end?: string;
  type: AgendaEventType;
  who?: string;
  endDate?: string;
  allDay?: boolean;
  description?: string;
  location?: string;
  online?: boolean;
  link?: string;
  organiser?: string;
  attendees?: { userId: string; required: boolean }[];
}

/** Fictional colleagues belonging to the single demo organization. */
export const AGENDA_USERS = [
  { id: "u-eva", name: "Eva Kuipers", organizationId: "demo-agency" },
  { id: "u-ruben", name: "Ruben de Wit", organizationId: "demo-agency" },
  { id: "u-marloes", name: "Marloes Peeters", organizationId: "demo-agency" },
] as const;

export const AGENDA_EVENTS: readonly AgendaEvent[] = [
  {
    id: "ev-01",
    title: "Kennismaking Sanne Willems",
    date: "2026-10-26",
    start: "10:00",
    end: "10:45",
    type: "gesprek",
  },
  { id: "ev-02", title: "Intake Brouwer Logistiek", date: "2026-10-27", start: "14:00", end: "15:00", type: "intake" },
  {
    id: "ev-03",
    title: "Gesprek Joris van den Berg",
    date: "2026-10-28",
    start: "11:30",
    end: "12:30",
    type: "gesprek",
  },
  { id: "ev-04", title: "Shortlist Vermeulen Techniek", date: "2026-10-29", type: "deadline" },
  { id: "ev-05", title: "Intake Dekker & Zonen", date: "2026-10-30", start: "09:00", end: "10:00", type: "intake" },
  { id: "ev-06", title: "Gesprek Lotte Hendriks", date: "2026-10-30", start: "13:30", end: "14:30", type: "gesprek" },
  { id: "ev-07", title: "Aanbod Pieter Jansen versturen", date: "2026-10-30", type: "deadline" },
  { id: "ev-08", title: "Gesprek Noor Bakker", date: "2026-11-02", start: "10:30", end: "11:30", type: "gesprek" },
  { id: "ev-09", title: "Intake Smit Installatie", date: "2026-11-03", start: "15:00", end: "16:00", type: "intake" },
  {
    id: "ev-10",
    title: "Tweede gesprek Thijs Mulder",
    date: "2026-11-04",
    start: "09:30",
    end: "10:30",
    type: "gesprek",
  },
  { id: "ev-11", title: "Vacaturetekst Planner goedkeuren", date: "2026-11-04", type: "deadline" },
  { id: "ev-12", title: "Intake Hoekstra Retail", date: "2026-11-05", start: "13:00", end: "14:00", type: "intake" },
  { id: "ev-13", title: "Gesprek Fatima El Amrani", date: "2026-11-05", start: "16:00", end: "17:00", type: "gesprek" },
  { id: "ev-14", title: "Contract Daan Visser", date: "2026-11-06", type: "deadline" },
  { id: "ev-15", title: "Gesprek Emma de Boer", date: "2026-11-09", start: "11:00", end: "12:00", type: "gesprek" },
  { id: "ev-16", title: "Intake Van Dijk Bouw", date: "2026-11-10", start: "10:00", end: "11:00", type: "intake" },
  { id: "ev-17", title: "Gesprek Mehmet Yilmaz", date: "2026-11-12", start: "14:30", end: "15:30", type: "gesprek" },
  { id: "ev-18", title: "Offerte Brouwer Logistiek", date: "2026-11-13", type: "deadline" },
  { id: "ev-19", title: "Intake Peters Accountancy", date: "2026-10-21", start: "09:30", end: "10:30", type: "intake" },
  { id: "ev-21", title: "Intake Hoekstra Retail", date: "2026-10-01", start: "10:00", end: "11:00", type: "intake" },
  { id: "ev-22", title: "Gesprek Anouk Smit", date: "2026-10-02", start: "14:00", end: "15:00", type: "gesprek" },
  { id: "ev-23", title: "Gesprek Bram Dekker", date: "2026-10-06", start: "09:30", end: "10:30", type: "gesprek" },
  { id: "ev-24", title: "Vacaturetekst Calculator", date: "2026-10-07", type: "deadline" },
  { id: "ev-25", title: "Intake Smit Installatie", date: "2026-10-08", start: "13:00", end: "14:00", type: "intake" },
  { id: "ev-26", title: "Gesprek Daan Visser", date: "2026-10-08", start: "16:00", end: "17:00", type: "gesprek" },
  { id: "ev-27", title: "Shortlist Brouwer Logistiek", date: "2026-10-12", type: "deadline" },
  { id: "ev-28", title: "Gesprek Emma de Boer", date: "2026-10-13", start: "11:00", end: "12:00", type: "gesprek" },
  { id: "ev-29", title: "Intake Van Dijk Bouw", date: "2026-10-14", start: "10:30", end: "11:30", type: "intake" },
  {
    id: "ev-30",
    title: "Tweede gesprek Bram Dekker",
    date: "2026-10-15",
    start: "15:00",
    end: "16:00",
    type: "gesprek",
  },
  { id: "ev-31", title: "Contract Bram Dekker", date: "2026-10-16", type: "deadline" },
  { id: "ev-32", title: "Gesprek Mehmet Yilmaz", date: "2026-10-19", start: "09:00", end: "10:00", type: "gesprek" },
  { id: "ev-33", title: "Gesprek Fatima El Amrani", date: "2026-10-20", start: "13:30", end: "14:30", type: "gesprek" },
  { id: "ev-34", title: "Intake Vermeulen Techniek", date: "2026-10-20", start: "15:30", end: "16:30", type: "intake" },
  { id: "ev-20", title: "Gesprek Lars Koster", date: "2026-10-22", start: "15:30", end: "16:30", type: "gesprek" },
];

/* -------------------------------------------------------------------- Chat */

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  /** Local ISO date-time without zone, yyyy-mm-ddThh:mm. */
  at: string;
  text: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  /** Short role line shown under the name. */
  role: string;
  /** Messages that are not yet read. */
  unread: number;
  messages: readonly ChatMessage[];
}

export const CHAT_CONVERSATIONS: readonly ChatConversation[] = [
  {
    id: "c-sanne",
    name: "Sanne Willems",
    role: "Kandidaat · Senior Java Developer",
    unread: 2,
    messages: [
      { id: "m1", from: "me", at: "2026-10-28T16:10", text: "Hoi Sanne, bedankt voor het gesprek vandaag." },
      { id: "m2", from: "them", at: "2026-10-28T16:25", text: "Graag gedaan! Ik vond het een leuke functie." },
      { id: "m3", from: "me", at: "2026-10-29T09:05", text: "Wil je donderdag nog een tweede gesprek plannen?" },
      { id: "m4", from: "them", at: "2026-10-30T08:40", text: "Ja graag, donderdagmiddag past mij goed." },
      { id: "m5", from: "them", at: "2026-10-30T08:41", text: "Rond 14:00 kan ik. Past dat ook voor de klant?" },
    ],
  },
  {
    id: "c-team",
    name: "Team Recruitment",
    role: "Groep · 4 collega's",
    unread: 1,
    messages: [
      { id: "m1", from: "them", at: "2026-10-29T11:15", text: "Wie pakt de intake bij Dekker & Zonen morgen?" },
      { id: "m2", from: "me", at: "2026-10-29T11:20", text: "Dat doe ik. Ik begin om 09:00." },
      { id: "m3", from: "them", at: "2026-10-30T09:30", text: "Top. Vergeet de vacaturetekst niet mee te nemen." },
    ],
  },
  {
    id: "c-ilse",
    name: "Ilse Brouwer",
    role: "Klant · Brouwer Logistiek",
    unread: 0,
    messages: [
      { id: "m1", from: "them", at: "2026-10-27T13:00", text: "Kunnen we de shortlist nog deze week bespreken?" },
      { id: "m2", from: "me", at: "2026-10-27T13:30", text: "Zeker, ik stuur je vandaag nog een uitnodiging." },
      { id: "m3", from: "them", at: "2026-10-27T13:32", text: "Dank je wel!" },
    ],
  },
  {
    id: "c-joris",
    name: "Joris van den Berg",
    role: "Kandidaat · Software Tester",
    unread: 0,
    messages: [
      { id: "m1", from: "me", at: "2026-10-26T10:00", text: "Je cv is doorgestuurd naar de klant." },
      { id: "m2", from: "them", at: "2026-10-26T10:12", text: "Fijn, laat je me weten wat ze vinden?" },
    ],
  },
  {
    id: "c-pim",
    name: "Pim Vermeulen",
    role: "Klant · Vermeulen Techniek",
    unread: 3,
    messages: [
      { id: "m1", from: "them", at: "2026-10-30T07:55", text: "Goedemorgen, de kandidaat is gisteren langs geweest." },
      { id: "m2", from: "them", at: "2026-10-30T07:56", text: "We zijn positief en willen graag verder." },
      { id: "m3", from: "them", at: "2026-10-30T07:58", text: "Kun je een voorstel voor de voorwaarden sturen?" },
    ],
  },
  {
    id: "c-noor",
    name: "Noor Bakker",
    role: "Kandidaat · Frontend Developer",
    unread: 0,
    messages: [{ id: "m1", from: "them", at: "2026-10-23T15:20", text: "Hartelijk dank voor de update." }],
  },
  {
    id: "c-femke",
    name: "Femke Hoekstra",
    role: "Klant · Hoekstra Retail",
    unread: 0,
    messages: [{ id: "m1", from: "me", at: "2026-10-22T09:00", text: "Ik bel je donderdag over de nieuwe vacature." }],
  },
];

/* ------------------------------------------------------------------ Kanban */

export type PipelineStage = "nieuw" | "in_behandeling" | "gesprek" | "aanbod" | "geplaatst" | "afgewezen";

export interface PipelineCandidate {
  id: string;
  name: string;
  role: string;
  stage: PipelineStage;
  recruiter: string;
  source: string;
  daysInStage: number;
  tags: readonly string[];
  email: string;
  phone: string;
  city: string;
  salary: string;
  note: string;
  urgent?: boolean;
}

export const PIPELINE_VACANCY = "Senior Java Developer · Vermeulen Techniek";
export const PIPELINE_RECRUITERS = ["Eva Kuipers", "Ruben de Wit", "Marloes Peeters"] as const;

export const PIPELINE_CANDIDATES: readonly PipelineCandidate[] = [
  {
    id: "p01",
    name: "Sanne Willems",
    role: "Senior Java Developer",
    stage: "nieuw",
    recruiter: "Eva Kuipers",
    source: "LinkedIn",
    daysInStage: 1,
    tags: ["Java", "Spring"],
    email: "sanne.willems@voorbeeld.nl",
    phone: "06-12345601",
    city: "Utrecht",
    salary: "€ 78.000",
    note: "Sterk profiel, werkt nu bij een scale-up.",
  },
  {
    id: "p02",
    name: "Joris van den Berg",
    role: "Software Tester",
    stage: "nieuw",
    recruiter: "Ruben de Wit",
    source: "Website",
    daysInStage: 2,
    tags: ["Selenium", "Cypress"],
    email: "joris.vandenberg@voorbeeld.nl",
    phone: "06-12345602",
    city: "Amersfoort",
    salary: "€ 62.000",
    note: "Reageerde op de website, snel terugbellen.",
    urgent: true,
  },
  {
    id: "p03",
    name: "Fatima El Amrani",
    role: "Backend Developer",
    stage: "nieuw",
    recruiter: "Eva Kuipers",
    source: "Referral",
    daysInStage: 3,
    tags: ["Kotlin", "AWS"],
    email: "fatima.elamrani@voorbeeld.nl",
    phone: "06-12345603",
    city: "Rotterdam",
    salary: "€ 72.000",
    note: "Aanbevolen door een eerdere plaatsing.",
  },
  {
    id: "p04",
    name: "Daan Visser",
    role: "DevOps Engineer",
    stage: "nieuw",
    recruiter: "Marloes Peeters",
    source: "LinkedIn",
    daysInStage: 5,
    tags: ["Docker", "Terraform"],
    email: "daan.visser@voorbeeld.nl",
    phone: "06-12345604",
    city: "Eindhoven",
    salary: "€ 70.000",
    note: "Open voor hybride werken.",
  },
  {
    id: "p05",
    name: "Lotte Hendriks",
    role: "Full Stack Developer",
    stage: "in_behandeling",
    recruiter: "Ruben de Wit",
    source: "Website",
    daysInStage: 2,
    tags: ["React", "TypeScript"],
    email: "lotte.hendriks@voorbeeld.nl",
    phone: "06-12345605",
    city: "Arnhem",
    salary: "€ 68.000",
    note: "Telefonisch screening gepland.",
  },
  {
    id: "p06",
    name: "Mehmet Yilmaz",
    role: "Data Engineer",
    stage: "in_behandeling",
    recruiter: "Eva Kuipers",
    source: "Referral",
    daysInStage: 4,
    tags: ["Python", "Spark"],
    email: "mehmet.yilmaz@voorbeeld.nl",
    phone: "06-12345606",
    city: "Den Haag",
    salary: "€ 74.000",
    note: "Wacht op referenties.",
  },
  {
    id: "p07",
    name: "Emma de Boer",
    role: "Product Designer",
    stage: "in_behandeling",
    recruiter: "Marloes Peeters",
    source: "LinkedIn",
    daysInStage: 6,
    tags: ["Figma", "UX"],
    email: "emma.deboer@voorbeeld.nl",
    phone: "06-12345607",
    city: "Haarlem",
    salary: "€ 64.000",
    note: "Portfolio is beoordeeld, goed beeld.",
  },
  {
    id: "p08",
    name: "Thijs Mulder",
    role: "Senior Java Developer",
    stage: "gesprek",
    recruiter: "Ruben de Wit",
    source: "LinkedIn",
    daysInStage: 3,
    tags: ["Java", "Kubernetes"],
    email: "thijs.mulder@voorbeeld.nl",
    phone: "06-12345608",
    city: "Zwolle",
    salary: "€ 80.000",
    note: "Tweede gesprek op 4 november.",
  },
  {
    id: "p09",
    name: "Noor Bakker",
    role: "Frontend Developer",
    stage: "gesprek",
    recruiter: "Eva Kuipers",
    source: "Website",
    daysInStage: 1,
    tags: ["TypeScript", "CSS"],
    email: "noor.bakker@voorbeeld.nl",
    phone: "06-12345609",
    city: "Leiden",
    salary: "€ 66.000",
    note: "Gesprek met de klant op 2 november.",
  },
  {
    id: "p10",
    name: "Lars Koster",
    role: "Java Developer",
    stage: "gesprek",
    recruiter: "Marloes Peeters",
    source: "Referral",
    daysInStage: 7,
    tags: ["Java", "SQL"],
    email: "lars.koster@voorbeeld.nl",
    phone: "06-12345610",
    city: "Breda",
    salary: "€ 69.000",
    note: "Wacht op feedback van de klant.",
    urgent: true,
  },
  {
    id: "p11",
    name: "Pieter Jansen",
    role: "Technical Lead",
    stage: "aanbod",
    recruiter: "Ruben de Wit",
    source: "Referral",
    daysInStage: 2,
    tags: ["Architectuur", "Scrum"],
    email: "pieter.jansen@voorbeeld.nl",
    phone: "06-12345611",
    city: "Utrecht",
    salary: "€ 92.000",
    note: "Aanbod wordt vandaag verstuurd.",
  },
  {
    id: "p12",
    name: "Anouk Smit",
    role: "Senior Java Developer",
    stage: "aanbod",
    recruiter: "Eva Kuipers",
    source: "LinkedIn",
    daysInStage: 4,
    tags: ["Java", "Azure"],
    email: "anouk.smit@voorbeeld.nl",
    phone: "06-12345612",
    city: "Delft",
    salary: "€ 84.000",
    note: "Onderhandelt over startdatum.",
  },
  {
    id: "p13",
    name: "Bram Dekker",
    role: "Senior Java Developer",
    stage: "geplaatst",
    recruiter: "Marloes Peeters",
    source: "Website",
    daysInStage: 12,
    tags: ["Java", "Microservices"],
    email: "bram.dekker@voorbeeld.nl",
    phone: "06-12345613",
    city: "Nijmegen",
    salary: "€ 82.000",
    note: "Start op 1 december.",
  },
];

/* --------------------------------------------------------------------- CRM */

export type DealStage = "lead" | "voorstel" | "onderhandeling" | "gewonnen" | "verloren";

export interface CrmCompany {
  id: string;
  name: string;
  sector: string;
  city: string;
  status: "actief" | "prospect" | "inactief";
  vacancies: number;
  owner: string;
  website: string;
  contactIds: readonly string[];
}

export interface CrmContact {
  id: string;
  name: string;
  function: string;
  companyId: string;
  email: string;
  phone: string;
}

export interface CrmDeal {
  id: string;
  title: string;
  companyId: string;
  contactId: string;
  stage: DealStage;
  /** Whole euros. */
  amount: number;
  /** ISO date. */
  closeDate: string;
  owner: string;
}

export const CRM_COMPANIES: readonly CrmCompany[] = [
  {
    id: "co1",
    name: "Vermeulen Techniek",
    sector: "Industrie",
    city: "Eindhoven",
    status: "actief",
    vacancies: 3,
    owner: "Eva Kuipers",
    website: "vermeulen-techniek.voorbeeld.nl",
    contactIds: ["ct1", "ct2"],
  },
  {
    id: "co2",
    name: "Brouwer Logistiek",
    sector: "Transport",
    city: "Tilburg",
    status: "actief",
    vacancies: 5,
    owner: "Ruben de Wit",
    website: "brouwer-logistiek.voorbeeld.nl",
    contactIds: ["ct3"],
  },
  {
    id: "co3",
    name: "Dekker & Zonen",
    sector: "Bouw",
    city: "Zwolle",
    status: "prospect",
    vacancies: 0,
    owner: "Marloes Peeters",
    website: "dekker-zonen.voorbeeld.nl",
    contactIds: ["ct4"],
  },
  {
    id: "co4",
    name: "Hoekstra Retail",
    sector: "Retail",
    city: "Utrecht",
    status: "actief",
    vacancies: 2,
    owner: "Eva Kuipers",
    website: "hoekstra-retail.voorbeeld.nl",
    contactIds: ["ct5"],
  },
  {
    id: "co5",
    name: "Smit Installatie",
    sector: "Techniek",
    city: "Groningen",
    status: "prospect",
    vacancies: 1,
    owner: "Ruben de Wit",
    website: "smit-installatie.voorbeeld.nl",
    contactIds: ["ct6"],
  },
  {
    id: "co6",
    name: "Peters Accountancy",
    sector: "Financieel",
    city: "Amsterdam",
    status: "inactief",
    vacancies: 0,
    owner: "Marloes Peeters",
    website: "peters-accountancy.voorbeeld.nl",
    contactIds: ["ct7"],
  },
  {
    id: "co7",
    name: "Van Dijk Bouw",
    sector: "Bouw",
    city: "Arnhem",
    status: "actief",
    vacancies: 4,
    owner: "Eva Kuipers",
    website: "vandijk-bouw.voorbeeld.nl",
    contactIds: ["ct8"],
  },
];

export const CRM_CONTACTS: readonly CrmContact[] = [
  {
    id: "ct1",
    name: "Pim Vermeulen",
    function: "Directeur",
    companyId: "co1",
    email: "pim.vermeulen@voorbeeld.nl",
    phone: "06-12345621",
  },
  {
    id: "ct2",
    name: "Karin Maas",
    function: "HR-manager",
    companyId: "co1",
    email: "karin.maas@voorbeeld.nl",
    phone: "06-12345622",
  },
  {
    id: "ct3",
    name: "Ilse Brouwer",
    function: "Operationeel manager",
    companyId: "co2",
    email: "ilse.brouwer@voorbeeld.nl",
    phone: "06-12345623",
  },
  {
    id: "ct4",
    name: "Wouter Dekker",
    function: "Eigenaar",
    companyId: "co3",
    email: "wouter.dekker@voorbeeld.nl",
    phone: "06-12345624",
  },
  {
    id: "ct5",
    name: "Femke Hoekstra",
    function: "Filiaalmanager",
    companyId: "co4",
    email: "femke.hoekstra@voorbeeld.nl",
    phone: "06-12345625",
  },
  {
    id: "ct6",
    name: "Gerrit Smit",
    function: "Technisch directeur",
    companyId: "co5",
    email: "gerrit.smit@voorbeeld.nl",
    phone: "06-12345626",
  },
  {
    id: "ct7",
    name: "Marit Peters",
    function: "Partner",
    companyId: "co6",
    email: "marit.peters@voorbeeld.nl",
    phone: "06-12345627",
  },
  {
    id: "ct8",
    name: "Joost van Dijk",
    function: "Projectleider",
    companyId: "co7",
    email: "joost.vandijk@voorbeeld.nl",
    phone: "06-12345628",
  },
];

export const CRM_DEALS: readonly CrmDeal[] = [
  {
    id: "d1",
    title: "Werving Senior Java Developer",
    companyId: "co1",
    contactId: "ct1",
    stage: "onderhandeling",
    amount: 18500,
    closeDate: "2026-11-15",
    owner: "Eva Kuipers",
  },
  {
    id: "d2",
    title: "Raamovereenkomst 2027",
    companyId: "co2",
    contactId: "ct3",
    stage: "voorstel",
    amount: 42000,
    closeDate: "2026-12-01",
    owner: "Ruben de Wit",
  },
  {
    id: "d3",
    title: "Vacature Calculator",
    companyId: "co3",
    contactId: "ct4",
    stage: "lead",
    amount: 9500,
    closeDate: "2026-12-10",
    owner: "Marloes Peeters",
  },
  {
    id: "d4",
    title: "Filiaalmanagers werven",
    companyId: "co4",
    contactId: "ct5",
    stage: "gewonnen",
    amount: 24750,
    closeDate: "2026-10-20",
    owner: "Eva Kuipers",
  },
  {
    id: "d5",
    title: "Monteurs en installateurs",
    companyId: "co5",
    contactId: "ct6",
    stage: "voorstel",
    amount: 15200,
    closeDate: "2026-11-25",
    owner: "Ruben de Wit",
  },
  {
    id: "d6",
    title: "Financieel medewerker",
    companyId: "co6",
    contactId: "ct7",
    stage: "verloren",
    amount: 7800,
    closeDate: "2026-10-05",
    owner: "Marloes Peeters",
  },
  {
    id: "d7",
    title: "Uitvoerders bouw",
    companyId: "co7",
    contactId: "ct8",
    stage: "gewonnen",
    amount: 31400,
    closeDate: "2026-10-12",
    owner: "Eva Kuipers",
  },
  {
    id: "d8",
    title: "Planner uitbreiding",
    companyId: "co2",
    contactId: "ct3",
    stage: "lead",
    amount: 11250,
    closeDate: "2027-01-15",
    owner: "Ruben de Wit",
  },
];

/* ----------------------------------------------------------------- Notities */

export type NoteColor = "geel" | "blauw" | "groen" | "roze" | "paars" | "neutraal";

export interface DemoNote {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  archived: boolean;
  tags: readonly string[];
  /** ISO date of the last change. */
  updated: string;
}

export const NOTE_COLORS: readonly NoteColor[] = ["geel", "blauw", "groen", "roze", "paars", "neutraal"];

export const DEMO_NOTES: readonly DemoNote[] = [
  {
    id: "n1",
    title: "Intake Dekker & Zonen",
    body: "Vragen voorbereiden: teamgrootte, salarisrange, startdatum en opvolging van de vorige vacature.",
    color: "geel",
    pinned: true,
    archived: false,
    tags: ["klant", "intake"],
    updated: "2026-10-30",
  },
  {
    id: "n2",
    title: "Feedback Sanne Willems",
    body: "Sterke technische achtergrond. Wil graag meer verantwoordelijkheid en een hybride werkweek.",
    color: "blauw",
    pinned: true,
    archived: false,
    tags: ["kandidaat"],
    updated: "2026-10-29",
  },
  {
    id: "n3",
    title: "Salarisbenchmark Java",
    body: "Senior Java rond € 75.000 tot € 85.000. Tech lead vanaf € 90.000.",
    color: "groen",
    pinned: false,
    archived: false,
    tags: ["markt"],
    updated: "2026-10-27",
  },
  {
    id: "n4",
    title: "Terugbellen deze week",
    body: "Femke Hoekstra, Gerrit Smit en Joost van Dijk.",
    color: "roze",
    pinned: false,
    archived: false,
    tags: ["to-do"],
    updated: "2026-10-26",
  },
  {
    id: "n5",
    title: "Ideeën LinkedIn-bericht",
    body: "Korte hook, concreet salaris noemen en een duidelijke vraag aan het einde.",
    color: "paars",
    pinned: false,
    archived: false,
    tags: ["marketing"],
    updated: "2026-10-24",
  },
  {
    id: "n6",
    title: "Evaluatie Q3",
    body: "Doorlooptijd verkort van 38 naar 31 dagen. Focus Q4: meer intakegesprekken met nieuwe klanten.",
    color: "neutraal",
    pinned: false,
    archived: false,
    tags: ["intern"],
    updated: "2026-10-20",
  },
  {
    id: "n7",
    title: "Checklist eerste werkdag",
    body: "Laptop, toegangspas, introductie met het team en afspraak voor de eerste week.",
    color: "groen",
    pinned: false,
    archived: false,
    tags: ["plaatsing"],
    updated: "2026-10-15",
  },
  {
    id: "n8",
    title: "Oude vacaturetekst Planner",
    body: "Vervangen door de nieuwe versie van 4 november.",
    color: "neutraal",
    pinned: false,
    archived: true,
    tags: ["vacature"],
    updated: "2026-09-30",
  },
];

/* ---------------------------------------------------------------- Contacten */

export interface DemoContact {
  id: string;
  name: string;
  function: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  favourite: boolean;
  activity: readonly { id: string; text: string; date: string }[];
}

export const DEMO_CONTACTS: readonly DemoContact[] = [
  {
    id: "k01",
    name: "Anouk Smit",
    function: "Senior Java Developer",
    company: "Kandidaat",
    email: "anouk.smit@voorbeeld.nl",
    phone: "06-12345612",
    city: "Delft",
    favourite: false,
    activity: [
      { id: "a1", text: "Aanbod besproken per telefoon", date: "2026-10-29" },
      { id: "a2", text: "Tweede gesprek bij Vermeulen Techniek", date: "2026-10-22" },
    ],
  },
  {
    id: "k02",
    name: "Bram Dekker",
    function: "Senior Java Developer",
    company: "Geplaatst",
    email: "bram.dekker@voorbeeld.nl",
    phone: "06-12345613",
    city: "Nijmegen",
    favourite: true,
    activity: [{ id: "a1", text: "Contract getekend", date: "2026-10-18" }],
  },
  {
    id: "k03",
    name: "Daan Visser",
    function: "DevOps Engineer",
    company: "Kandidaat",
    email: "daan.visser@voorbeeld.nl",
    phone: "06-12345604",
    city: "Eindhoven",
    favourite: false,
    activity: [{ id: "a1", text: "Cv ontvangen via LinkedIn", date: "2026-10-25" }],
  },
  {
    id: "k04",
    name: "Emma de Boer",
    function: "Product Designer",
    company: "Kandidaat",
    email: "emma.deboer@voorbeeld.nl",
    phone: "06-12345607",
    city: "Haarlem",
    favourite: false,
    activity: [
      { id: "a1", text: "Portfolio beoordeeld", date: "2026-10-27" },
      { id: "a2", text: "Eerste telefoongesprek", date: "2026-10-21" },
    ],
  },
  {
    id: "k05",
    name: "Fatima El Amrani",
    function: "Backend Developer",
    company: "Kandidaat",
    email: "fatima.elamrani@voorbeeld.nl",
    phone: "06-12345603",
    city: "Rotterdam",
    favourite: true,
    activity: [{ id: "a1", text: "Gesprek ingepland op 5 november", date: "2026-10-28" }],
  },
  {
    id: "k06",
    name: "Femke Hoekstra",
    function: "Filiaalmanager",
    company: "Hoekstra Retail",
    email: "femke.hoekstra@voorbeeld.nl",
    phone: "06-12345625",
    city: "Utrecht",
    favourite: false,
    activity: [{ id: "a1", text: "Intake ingepland op 5 november", date: "2026-10-26" }],
  },
  {
    id: "k07",
    name: "Gerrit Smit",
    function: "Technisch directeur",
    company: "Smit Installatie",
    email: "gerrit.smit@voorbeeld.nl",
    phone: "06-12345626",
    city: "Groningen",
    favourite: false,
    activity: [{ id: "a1", text: "Offerte besproken", date: "2026-10-23" }],
  },
  {
    id: "k08",
    name: "Ilse Brouwer",
    function: "Operationeel manager",
    company: "Brouwer Logistiek",
    email: "ilse.brouwer@voorbeeld.nl",
    phone: "06-12345623",
    city: "Tilburg",
    favourite: true,
    activity: [
      { id: "a1", text: "Shortlist besproken", date: "2026-10-27" },
      { id: "a2", text: "Raamovereenkomst voorgesteld", date: "2026-10-14" },
    ],
  },
  {
    id: "k09",
    name: "Joost van Dijk",
    function: "Projectleider",
    company: "Van Dijk Bouw",
    email: "joost.vandijk@voorbeeld.nl",
    phone: "06-12345628",
    city: "Arnhem",
    favourite: false,
    activity: [{ id: "a1", text: "Intake op 10 november", date: "2026-10-24" }],
  },
  {
    id: "k10",
    name: "Joris van den Berg",
    function: "Software Tester",
    company: "Kandidaat",
    email: "joris.vandenberg@voorbeeld.nl",
    phone: "06-12345602",
    city: "Amersfoort",
    favourite: false,
    activity: [{ id: "a1", text: "Cv doorgestuurd naar klant", date: "2026-10-26" }],
  },
  {
    id: "k11",
    name: "Karin Maas",
    function: "HR-manager",
    company: "Vermeulen Techniek",
    email: "karin.maas@voorbeeld.nl",
    phone: "06-12345622",
    city: "Eindhoven",
    favourite: false,
    activity: [{ id: "a1", text: "Vacaturetekst afgestemd", date: "2026-10-20" }],
  },
  {
    id: "k12",
    name: "Lars Koster",
    function: "Java Developer",
    company: "Kandidaat",
    email: "lars.koster@voorbeeld.nl",
    phone: "06-12345610",
    city: "Breda",
    favourite: false,
    activity: [{ id: "a1", text: "Gesprek bij klant gehad", date: "2026-10-22" }],
  },
  {
    id: "k13",
    name: "Lotte Hendriks",
    function: "Full Stack Developer",
    company: "Kandidaat",
    email: "lotte.hendriks@voorbeeld.nl",
    phone: "06-12345605",
    city: "Arnhem",
    favourite: false,
    activity: [{ id: "a1", text: "Screening gepland", date: "2026-10-28" }],
  },
  {
    id: "k14",
    name: "Marit Peters",
    function: "Partner",
    company: "Peters Accountancy",
    email: "marit.peters@voorbeeld.nl",
    phone: "06-12345627",
    city: "Amsterdam",
    favourite: false,
    activity: [{ id: "a1", text: "Deal gesloten als verloren", date: "2026-10-05" }],
  },
  {
    id: "k15",
    name: "Mehmet Yilmaz",
    function: "Data Engineer",
    company: "Kandidaat",
    email: "mehmet.yilmaz@voorbeeld.nl",
    phone: "06-12345606",
    city: "Den Haag",
    favourite: false,
    activity: [{ id: "a1", text: "Referenties opgevraagd", date: "2026-10-29" }],
  },
  {
    id: "k16",
    name: "Noor Bakker",
    function: "Frontend Developer",
    company: "Kandidaat",
    email: "noor.bakker@voorbeeld.nl",
    phone: "06-12345609",
    city: "Leiden",
    favourite: true,
    activity: [{ id: "a1", text: "Gesprek met klant op 2 november", date: "2026-10-28" }],
  },
  {
    id: "k17",
    name: "Pieter Jansen",
    function: "Technical Lead",
    company: "Kandidaat",
    email: "pieter.jansen@voorbeeld.nl",
    phone: "06-12345611",
    city: "Utrecht",
    favourite: false,
    activity: [{ id: "a1", text: "Aanbod opgesteld", date: "2026-10-29" }],
  },
  {
    id: "k18",
    name: "Pim Vermeulen",
    function: "Directeur",
    company: "Vermeulen Techniek",
    email: "pim.vermeulen@voorbeeld.nl",
    phone: "06-12345621",
    city: "Eindhoven",
    favourite: true,
    activity: [
      { id: "a1", text: "Voorwaarden aangevraagd", date: "2026-10-30" },
      { id: "a2", text: "Kandidaat gepresenteerd", date: "2026-10-28" },
    ],
  },
  {
    id: "k19",
    name: "Sanne Willems",
    function: "Senior Java Developer",
    company: "Kandidaat",
    email: "sanne.willems@voorbeeld.nl",
    phone: "06-12345601",
    city: "Utrecht",
    favourite: true,
    activity: [
      { id: "a1", text: "Tweede gesprek afgestemd", date: "2026-10-30" },
      { id: "a2", text: "Kennismaking gehad", date: "2026-10-26" },
    ],
  },
  {
    id: "k20",
    name: "Thijs Mulder",
    function: "Senior Java Developer",
    company: "Kandidaat",
    email: "thijs.mulder@voorbeeld.nl",
    phone: "06-12345608",
    city: "Zwolle",
    favourite: false,
    activity: [{ id: "a1", text: "Tweede gesprek op 4 november", date: "2026-10-27" }],
  },
  {
    id: "k21",
    name: "Wouter Dekker",
    function: "Eigenaar",
    company: "Dekker & Zonen",
    email: "wouter.dekker@voorbeeld.nl",
    phone: "06-12345624",
    city: "Zwolle",
    favourite: false,
    activity: [{ id: "a1", text: "Intake vandaag om 09:00", date: "2026-10-30" }],
  },
];
