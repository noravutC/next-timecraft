// projects/page.tsx
"use client";

import React, { useState, useEffect } from "react";
// hooks
import { useProjectStore } from '@/hooks/useProjects.hook';
// components
import { CreateProjectForm } from "./components/create-project-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectCard } from "./components/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Filter, FolderPlus, Grid, List, Plus } from "lucide-react";
// types
import { type Project } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PreviewCard } from "./components/preview-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const { fetchProjects, projects, status } = useProjectStore();
  // const [projects, setProjects] = useState<Project[]>([]);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [isNewProject, setIsNewProject] = useState<boolean>(false);

  const currentProjects = Object.values(projects);
  useEffect(() => {
    const loadProjects = async () => {
      await fetchProjects();
      // setProjects(response);
    };
    loadProjects();
  }, []);

  return (
    <>
      {!isNewProject && (
        <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
          <div className="w-full max-h-[7vh] h-full flex items-center justify-between px-2 duration-300">
            {/* Header Area */}
            <span className="text-gray-800 text-[2rem] font-[700]">Projects</span>
            <Button
              className="cursor-pointer select-none"
              variant={'ghost'}
              onClick={() => setIsNewProject(true)}
            >
              <Plus size={13} />
              New Project
            </Button>
          </div>
          <div className="h-[10vh] flex justify-between items-center">
            <div className="flex-1 flex items-center justify-start pr-4 pl-1">
              <Input
                placeholder="Search project..."
                className="focus-visible:border-none focus-visible:ring-2"
                autoFocus
              />
            </div>
            <div className="flex gap-2 items-center justify-end">
              <Button className="cursor-pointer select-none" variant={'outline'}>
                <Filter size={13} />
                Filter
              </Button>
              <div className="flex items-center max-w-max w-full max-h-[36px] h-[36px]  text-gray-700 border rounded">
                <div className={cn("max-w-fit h-full px-2 flex items-center justify-center", displayMode === 'grid' ? "bg-gray-100 rounded-l" : "")} onClick={() => setDisplayMode('grid')}>
                  <Grid className="size-5" />
                </div>
                <div className={cn("max-w-fit h-full px-2 flex items-center justify-center", displayMode === 'list' ? "bg-gray-100 rounded-r" : "")} onClick={() => setDisplayMode('list')}>
                  <List className="size-5" />
                </div>
              </div>
            </div>
          </div>
          <ScrollArea className="h-[70vh] min-w-full py-4 pr-4">
            {displayMode === 'grid' && (
              <>
                {status !== "none" ? (
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="w-full h-[250px]" />
                    <Skeleton className="w-full h-[250px]" />
                    <Skeleton className="w-full h-[250px]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {(currentProjects ?? []).map((project) => (
                      <ProjectCard key={project._id} projectId={project._id} />
                    ))}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </div>
      )}
      {isNewProject && (
        <div className="max-w-full w-full h-full max-h-[87vh] overflow-x-hidden flex flex-col">
          <div className="max-h-[7vh] h-full w-full flex items-center justify-start">
            <Button
              variant={'ghost'}
              onClick={() => setIsNewProject(false)}
              className="cursor-pointer select-none ml-2 text-gray-500 text-sm font-[500]"
            >
              <ArrowLeft size={13} />
              Back to projects
            </Button>
          </div>
          <div className="max-h-[80vh] h-[80vh] w-full">
            <CreateProjectForm />
          </div>
        </div>
      )}
    </>
  )
}