import type { KanbanColumnData } from "@talentstroom/ui";

export interface Candidate {
  id: string;
  name: string;
  role: string;
  city: string;
  status: string;
  tone: "info" | "violet" | "success" | "warning";
  date: string;
}
export const candidates: Candidate[] = [
  {
    id: "1",
    name: "Sophie Bakker",
    role: "Frontend Developer",
    city: "Amsterdam",
    status: "Gesprek",
    tone: "violet",
    date: "30 okt",
  },
  {
    id: "2",
    name: "Mark Jansen",
    role: "Backend Developer",
    city: "Utrecht",
    status: "Aanbod",
    tone: "success",
    date: "29 okt",
  },
  {
    id: "3",
    name: "Lisa de Wit",
    role: "Product Designer",
    city: "Rotterdam",
    status: "In behandeling",
    tone: "warning",
    date: "28 okt",
  },
  {
    id: "4",
    name: "Thomas van Dijk",
    role: "DevOps Engineer",
    city: "Den Haag",
    status: "Nieuw",
    tone: "info",
    date: "27 okt",
  },
];
export const initialPipeline: KanbanColumnData[] = [
  {
    id: "new",
    title: "Nieuw",
    tone: "info",
    cards: [
      { id: "c1", name: "Lisa Jansen", role: "Marketing Specialist", meta: "Voorbeeldgroep", age: "2d" },
      { id: "c2", name: "Daan de Wit", role: "Sales Executive", meta: "ScaleUp BV", age: "3d" },
    ],
  },
  {
    id: "talk",
    title: "In gesprek",
    tone: "violet",
    cards: [
      { id: "c3", name: "Tom van Dijk", role: "Backend Developer", meta: "Vandaag", age: "1d" },
      { id: "c4", name: "Emma Smit", role: "Project Manager", meta: "Vandaag", age: "1d" },
    ],
  },
  {
    id: "offer",
    title: "Aanbod",
    tone: "success",
    cards: [{ id: "c5", name: "Mark Scholten", role: "UX Researcher", meta: "Innovatech", age: "2d" }],
  },
  {
    id: "placed",
    title: "Geplaatst",
    tone: "success",
    cards: [{ id: "c6", name: "Laura Kramer", role: "Recruiter", meta: "TalentStroom", age: "5d" }],
  },
];
