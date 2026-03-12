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
        { name: "Backlog", color: "#60A5FA", orderFraction: "0" },
        { name: "In Progress", color: "#F59E0B", orderFraction: "1" },
        { name: "Done", color: "#34D399", orderFraction: "2" },
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
        { name: "Todo", color: "#93C5FD", orderFraction: "0" },
        { name: "In Development", color: "#FBBF24", orderFraction: "1" },
        { name: "Review", color: "#A78BFA", orderFraction: "2" },
        { name: "Released", color: "#34D399", orderFraction: "3" },
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
        { name: "Ideas", color: "#93C5FD", orderFraction: "0" },
        { name: "Drafting", color: "#F97316", orderFraction: "1" },
        { name: "Editing", color: "#FBBF24", orderFraction: "2" },
        { name: "Published", color: "#10B981", orderFraction: "3" },
      ],
    },
  ];

  const templates: ProjectTemplate[] = seeds.map((template) => createProjectTemplate(template));

  return Object.assign(templates, {
    template_1: templates[0],
    template_2: templates[1],
    template_3: templates[2],
  });
})();
