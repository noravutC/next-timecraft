import React from "react";
import { Columns, Layout, ListTodo } from "lucide-react";
import type { CreateColumnPayload } from "@/types";

export type ProjectTemplate = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  columns: CreateColumnPayload[];
};

type ProjectTemplateSeed = Omit<ProjectTemplate, "columns"> & {
  columns: Omit<CreateColumnPayload, "projectId">[];
};

const createProjectTemplate = (seed: ProjectTemplateSeed): ProjectTemplate => {
  let currentProjectId = seed.projectId;
  let currentColumns: CreateColumnPayload[] = seed.columns.map((column) => ({
    ...column,
    projectId: currentProjectId,
  }));

  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    icon: seed.icon,
    color: seed.color,
    get projectId() {
      return currentProjectId;
    },
    set projectId(nextProjectId: string) {
      currentProjectId = nextProjectId;
      currentColumns = currentColumns.map((column) => ({
        ...column,
        projectId: nextProjectId,
      }));
    },
    get columns() {
      return currentColumns;
    },
    set columns(nextColumns: CreateColumnPayload[]) {
      currentColumns = nextColumns.map((column) => ({
        ...column,
        projectId: currentProjectId,
      }));
    },
  };
};

export const PROJECT_TEMPLATES: ProjectTemplate[] &
  Record<"template_1" | "template_2" | "template_3", ProjectTemplate> = (() => {
  const seeds: ProjectTemplateSeed[] = [
    {
      id: "basic",
      projectId: "template_1",
      name: "Basic Kanban",
      description: "Simple backlog -> in progress -> done workflow.",
      icon: <Columns size={22} />,
      color: "bg-blue-100 text-blue-600",
      columns: [
        { name: "Backlog", color: "#60A5FA", orderFraction: "a0" },
        { name: "In Progress", color: "#F59E0B", orderFraction: "a1" },
        { name: "Done", color: "#34D399", orderFraction: "a2" },
      ],
    },
    {
      id: "sprint",
      projectId: "template_2",
      name: "Sprint Board",
      description: "Plan, build, review and release in short cycles.",
      icon: <ListTodo size={22} />,
      color: "bg-emerald-100 text-emerald-600",
      columns: [
        { name: "Todo", color: "#93C5FD", orderFraction: "a0" },
        { name: "In Development", color: "#FBBF24", orderFraction: "a1" },
        { name: "Review", color: "#A78BFA", orderFraction: "a2" },
        { name: "Released", color: "#34D399", orderFraction: "a3" },
      ],
    },
    {
      id: "content",
      projectId: "template_3",
      name: "Content Pipeline",
      description: "Handle idea, draft, editing and publishing.",
      icon: <Layout size={22} />,
      color: "bg-orange-100 text-orange-600",
      columns: [
        { name: "Ideas", color: "#93C5FD", orderFraction: "a0" },
        { name: "Drafting", color: "#F97316", orderFraction: "a1" },
        { name: "Editing", color: "#FBBF24", orderFraction: "a2" },
        { name: "Published", color: "#10B981", orderFraction: "a3" },
      ],
    },
  ];

  const templates: ProjectTemplate[] = seeds.map((template) =>
    createProjectTemplate(template),
  );

  return Object.assign(templates, {
    template_1: templates[0],
    template_2: templates[1],
    template_3: templates[2],
  });
})();

// ─── Board templates (Create-Board dialog) ──────────────────────────────
// ข้อมูลล้วน ไม่มี JSX — dialog เอาไปประกอบ CreateColumnPayload เอง

export type BoardTemplate = {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  emojiBg: string; // tailwind class ของกล่องไอคอน
  columns: { name: string; color: string }[];
};

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "kanban",
    name: "Kanban Board",
    tagline: "Classic task flow",
    emoji: "📋",
    emojiBg: "bg-red-50",
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
    emoji: "🏃",
    emojiBg: "bg-emerald-50",
    columns: [
      { name: "Product Backlog", color: "#94A3B8" },
      { name: "Sprint Backlog", color: "#FBBF24" },
      { name: "In Progress", color: "#F97316" },
      { name: "In Review", color: "#60A5FA" },
      { name: "Done", color: "#34D399" },
    ],
  },
  {
    id: "bug",
    name: "Bug Tracking",
    tagline: "Triage & fix issues",
    emoji: "🐞",
    emojiBg: "bg-rose-50",
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
    emoji: "🚀",
    emojiBg: "bg-pink-50",
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
    tagline: "Plan & publish content",
    emoji: "🎨",
    emojiBg: "bg-orange-50",
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
    emoji: "◻️",
    emojiBg: "bg-brand-soft/60",
    columns: [
      { name: "To Do", color: "#94A3B8" },
      { name: "Doing", color: "#FBBF24" },
      { name: "Done", color: "#34D399" },
    ],
  },
];
