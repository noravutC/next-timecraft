//projects/page.tsx
"use client";

import React from "react";
import { useProjectStore } from '@/hooks/useProjects.hook';
import { KanbanBoard } from "./components/kanban/kanban-board";
import { useProjectAtMenu } from "../../../context/project/project-menu-context";
import { ProjectToolsLayout } from "./project-tools-layout";

export default  function ProjectsContent() {
  const { projectIdActivate } = useProjectStore();
  const { menuValue } = useProjectAtMenu();

  return (
    <ProjectToolsLayout>

      {menuValue === "Board" && (
        <KanbanBoard projectId={projectIdActivate} />
      )}
    </ProjectToolsLayout>
  );
}
