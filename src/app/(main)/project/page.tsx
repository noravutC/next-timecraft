//projects/page.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { useProjectStore } from '@/hooks/useProjects.hook';
import { KanbanBoard } from "./components/kanban/kanban-board";
import { useProjectAtMenu } from "../../../context/project/project-menu-context";
import { ProjectToolsLayout } from "./project-tools-layout";
import { Board } from "./_components/board";
import { boardFromColumnMap } from "./_components/data";
import { useBoardMapStore } from "@/hooks/store";


export default  function ProjectsContent() {
  const { projectIdActivate } = useProjectStore();
  const { menuValue } = useProjectAtMenu();
  const { fetchBoardColumnMapTaskByProjectId, columnMap } = useBoardMapStore();
  const boardData = useMemo(() => boardFromColumnMap(columnMap), [columnMap]);
  useEffect(() => {
    if (!projectIdActivate) return;
    fetchBoardColumnMapTaskByProjectId(projectIdActivate);
  }, [projectIdActivate]);
  return (
    <ProjectToolsLayout>
      <Board initial={boardData} />
      {/* {menuValue === "Board" && (
        <KanbanBoard projectId={projectIdActivate} />
      )} */}
    </ProjectToolsLayout>
  );
}
