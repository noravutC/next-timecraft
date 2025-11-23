// // projects/page.tsx
// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// // hooks
// import { useProjectStore } from '@/hooks/useProjects.hook';
// // components
// import { KanbanBoard } from "./components/kanban/kanban-board";
// // import { TemplateColumnForm } from "./components/sub-create-project/template-column-form";
// // context
// import { useProjectAtMenu } from "./context/project-menu-context";
// import { ProjectToolsLayout } from "./project-tools-layout";
// // types
// // import { LoaderPage } from "@/components/Loader-page";

// export default function Projects() {
//   const { projectIdActivate } = useProjectStore();
//   const { menuValue } = useProjectAtMenu();
//   return (
//     <ProjectToolsLayout>
//       {menuValue === "Board" && (
//         <KanbanBoard projectId={projectIdActivate} />
//       )}
//       {/* {menuValue === "Board Templates" && (
//         <TemplateColumnForm projectId={projectIdActivate} />
//       )} */}
//     </ProjectToolsLayout>
//   )
// }
// projects/page.tsx
export const dynamic = "force-dynamic";
"use client";

import React from "react";
import { useProjectStore } from '@/hooks/useProjects.hook';
import { KanbanBoard } from "./components/kanban/kanban-board";
import { useProjectAtMenu } from "./context/project-menu-context";
import { ProjectToolsLayout } from "./project-tools-layout";
import { ProjectTabProvider } from "./context/project-menu-context";

export default function Projects() {

  return (
    <ProjectTabProvider>
      <ProjectsContent />
    </ProjectTabProvider>
  );
}

function ProjectsContent() {
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
