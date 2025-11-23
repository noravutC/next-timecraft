//projects/page.tsx
"use client";

import React from "react";
import { useProjectStore } from '@/hooks/useProjects.hook';
// import { KanbanBoard } from "./components/kanban/kanban-board";
import { useProjectAtMenu } from "../../../context/project/project-menu-context";
import dynamic from 'next/dynamic';
const KanbanBoard = dynamic(() => import('./components/kanban/kanban-board').then((mod) => mod.KanbanBoard), { ssr: false });

export default  function ProjectsContent() {
  const { projectIdActivate } = useProjectStore();
  const { menuValue } = useProjectAtMenu();

  return (
    <>

      {menuValue === "Board" && (
        <KanbanBoard projectId={projectIdActivate} />
      )}
    </>
  );
}
