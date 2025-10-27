// projects/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
// hooks
import { useProjectStore } from '@/hooks/useProjects.hook';
// components
import { KanbanBoard } from "./components/kanban/kanban-board";
import { TemplateColumnForm } from "./components/sub-create-project/template-column-form";
// context
import { useProjectTab } from "./context/project-tab-context";
// types
// import { LoaderPage } from "@/components/Loader-page";

export default function Projects() {
  const { projectIdActivate } = useProjectStore();
  const { tabValue } = useProjectTab();
  return (
    <>
      {tabValue === "Board" && (
        <KanbanBoard projectId={projectIdActivate} />
      )}
      {tabValue === "Board Templates" && (
        <TemplateColumnForm projectId={projectIdActivate} />
      )}
    </>
  )
  // return (
  //   <>
  //     {!isNewProject && (
  //       <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
  //         <div className="w-full max-h-[7vh] h-full flex items-center justify-between px-2 duration-300">
  //           <span className="text-gray-800 text-[2rem] font-[700]">Projects</span>
  //           <Button
  //             className="cursor-pointer select-none"
  //             variant={'ghost'}
  //             onClick={() => setIsNewProject(true)}
  //           >
  //             <Plus size={13} />
  //             New Project
  //           </Button>
  //         </div>
  //         <div className="h-[10vh] flex justify-between items-center">
  //           <div className="flex-1 flex items-center justify-start pr-4 pl-1">
  //             <Input
  //               placeholder="Search project..."
  //               className="focus-visible:border-none focus-visible:ring-2"
  //               autoFocus
  //               onChange={(e) => setSearch(e.target.value)}
  //             />
  //           </div>
  //           <div className="flex gap-2 items-center justify-end">
  //             <Button className="cursor-pointer select-none" variant={'outline'}>
  //               <Filter size={13} />
  //               Filter
  //             </Button>
  //             <div className="flex items-center max-w-max w-full max-h-[36px] h-[36px]  text-gray-700 border rounded">
  //               <div className={cn("max-w-fit h-full px-2 flex items-center justify-center", displayMode === 'grid' ? "bg-gray-100 rounded-l" : "")} onClick={() => setDisplayMode('grid')}>
  //                 <Grid className="size-5" />
  //               </div>
  //               <div className={cn("max-w-fit h-full px-2 flex items-center justify-center", displayMode === 'list' ? "bg-gray-100 rounded-r" : "")} onClick={() => setDisplayMode('list')}>
  //                 <List className="size-5" />
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //         <ScrollArea className="h-[70vh] min-w-full py-4 pr-4">
  //           {displayMode === 'grid' && (
  //             <>
  //               {status !== "none" ? (
  //                 <div className="grid grid-cols-3 gap-4">
  //                   <Skeleton className="w-full h-[250px]" />
  //                   <Skeleton className="w-full h-[250px]" />
  //                   <Skeleton className="w-full h-[250px]" />
  //                 </div>
  //               ) : (
  //                 <div className="grid grid-cols-3 gap-4">
  //                   {(searchProjects ?? []).map((project) => (
  //                     <ProjectCard key={project._id} projectId={project._id} />
  //                   ))}
  //                 </div>
  //               )}
  //             </>
  //           )}
  //         </ScrollArea>
  //       </div>
  //     )}
  //     {isNewProject && (
  //       <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
  //         <div className="max-h-[7vh] h-full w-full flex items-center justify-start">
  //           <Button
  //             variant={'ghost'}
  //             onClick={() => setIsNewProject(false)}
  //             className="cursor-pointer select-none ml-2 text-gray-500 text-sm font-[500]"
  //           >
  //             <ArrowLeft size={13} />
  //             Back to project
  //           </Button>
  //         </div>
  //         <div className="max-h-[80vh] h-[80vh] w-full">
  //           <CreateProjectForm onCloseNewProject={setIsNewProject} />
  //         </div>
  //       </div>
  //     )}
  //   </>
  // )
}

