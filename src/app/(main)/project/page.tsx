// projects/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
// hooks
import { useProjectStore } from '@/hooks/useProjects.hook';
// components
import { CreateProjectForm } from "./components/create-project-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "./components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp, Filter, FolderPlus, Grid, List, Plus } from "lucide-react";
// types
import { type Project } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PreviewCard } from "./components/preview-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TabProject } from "./components/tab-project";
import { KanbanBoard } from "./components/kanban/kanban-board";
import { ProjectSelector } from "./components/selector/project-selector";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { TemplateColumnForm } from "./components/sub-create-project/template-column-form";
// import { KanbanBoard } from "./components/kanban/kanban-test";

export default function Projects() {
  const { 
    fetchProjects, 
    projects, 
    status,
    projectIdActivate,
    getProjectById,
    setActivateProject,
  } = useProjectStore();
  // const [projects, setProjects] = useState<Project[]>([]);
  // const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  // const [isNewProject, setIsNewProject] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [tabValue, setTabValue] = useState<string>("Kanban");
  const currentProjects = Object.values(projects);
  // const [projectIdActivate, setProjectsActivate] = useState<string | null>(
  //   currentProjects.length > 0 ? currentProjects[0]._id : null
  // );

  const searchProjects = useMemo(() => {
    if (!search) return currentProjects;
    return currentProjects.filter((pj) =>
      pj.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, currentProjects]);


  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (currentProjects.length > 0 && !projectIdActivate) {
      setActivateProject(currentProjects[0]._id);
    }
  }, [currentProjects, setActivateProject]);

  // const SelectorProject = ProjectSelector<Project>;

  return (
    <>
      <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
        <div className="min-h-[60px] w-full flex justify-start items-center overflow-hidden">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 ml-2">Project</span>
            <div className="flex items-center">
              <span className="text-xl ml-2 font-[700] mr-4">{getProjectById(projectIdActivate ?? '')?.name ?? 'Un active project'}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size={'sm'}>
                    Switch project
                    <ArrowDownUp className="size-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuRadioGroup
                    value={projectIdActivate ?? undefined}
                    onValueChange={setActivateProject}
                  >
                    {currentProjects.map((project) => (
                      <DropdownMenuRadioItem key={project._id} value={project._id}>
                        {project.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="min-h-[55px] w-full">
          <TabProject tabValue={tabValue} selectTab={setTabValue} />
        </div>
        <div className="flex-1 h-full w-full pt-2 overflow-hidden">
            {tabValue === "Kanban" && (
              <KanbanBoard projectId={projectIdActivate} />
            )}
            {tabValue === "Board Templates" && (
                <TemplateColumnForm projectId={projectIdActivate} selectTab={setTabValue} />
            )}
        </div>
      </div>
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

