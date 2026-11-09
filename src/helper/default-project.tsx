// ─── Board templates (Create board dialog + first board page) ──────────
// ข้อมูลล้วน ไม่มี JSX — ชุดเดียวกับ prototype ทั้ง 2 หน้า

export type BoardTemplate = {
  id: string;
  name: string;
  tagline: string;
  columns: { name: string; color: string }[];
};

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "kanban",
    name: "Kanban Board",
    tagline: "Classic task flow",
    columns: [
      { name: "Backlog", color: "#94A3B8" },
      { name: "To Do", color: "#FBBF24" },
      { name: "In Progress", color: "#F97316" },
      { name: "Review", color: "#60A5FA" },
      { name: "Done", color: "#34D399" },
    ],
  },
  {
    id: "scrum",
    name: "Scrum Sprint",
    tagline: "Sprint-based workflow",
    columns: [
      { name: "Product Backlog", color: "#94A3B8" },
      { name: "Sprint Backlog", color: "#FBBF24" },
      { name: "In Progress", color: "#F97316" },
      { name: "In Review", color: "#60A5FA" },
      { name: "Done", color: "#34D399" },
    ],
  },
  {
    id: "bugs",
    name: "Bug Tracking",
    tagline: "Triage and fix issues",
    columns: [
      { name: "Reported", color: "#F87171" },
      { name: "Confirmed", color: "#FB923C" },
      { name: "In Progress", color: "#FBBF24" },
      { name: "Testing", color: "#60A5FA" },
      { name: "Resolved", color: "#34D399" },
    ],
  },
  {
    id: "roadmap",
    name: "Product Roadmap",
    tagline: "Plan by quarter",
    columns: [
      { name: "Ideas", color: "#94A3B8" },
      { name: "Planned", color: "#FBBF24" },
      { name: "This Quarter", color: "#F97316" },
      { name: "Shipped", color: "#34D399" },
    ],
  },
  {
    id: "content",
    name: "Content Calendar",
    tagline: "Plan and publish content",
    columns: [
      { name: "Ideas", color: "#94A3B8" },
      { name: "Drafting", color: "#FBBF24" },
      { name: "Editing", color: "#F97316" },
      { name: "Scheduled", color: "#60A5FA" },
      { name: "Published", color: "#34D399" },
    ],
  },
  {
    id: "blank",
    name: "Blank Board",
    tagline: "Start from scratch",
    columns: [
      { name: "To Do", color: "#94A3B8" },
      { name: "Doing", color: "#FBBF24" },
      { name: "Done", color: "#34D399" },
    ],
  },
];
