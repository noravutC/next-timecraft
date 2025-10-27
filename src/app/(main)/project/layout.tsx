// project/layout.tsx
'use client';
import React, { useEffect, useState } from "react";
// components
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuTrigger,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { TabProject } from "./components/tab-project";
// hooks
import { useProjectStore } from "@/hooks";
// utils
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectTabProvider } from "./context/project-tab-context";
import { LoaderPage } from "@/components/Loader-page";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const {
        fetchProjects,
        projects,
        status,
        projectIdActivate,
        getProjectById,
        setActivateProject,
    } = useProjectStore();
    const currentProjects = Object.values(projects);

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <ProjectTabProvider>
            <div className="relative max-w-full w-full h-full overflow-x-hidden flex flex-col">
                <div className="max-h-[60px] min-h-[60px] w-full flex justify-start items-center overflow-hidden">
                    <div className="flex flex-col">
                        {/* <span className="text-sm text-gray-500 ml-2">Project</span> */}
                        <div className="flex items-center">
                            {status === 'fetching' ? (
                                <Skeleton className="h-[30px] w-[120px] mr-4" />
                            ) : (
                                <>
                                    <span className="text-xl ml-2 font-[700] mr-4">{getProjectById(projectIdActivate ?? '')?.name ?? 'Un active project'}</span>
                                </>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="outline" size={'sm'} disabled={status === 'fetching'}>
                                        Switch project for now
                                        {status === 'fetching' ? (
                                            <LoaderCircle className="animate-spin text-gray-300 ml-1 size-4" strokeWidth={3} />
                                        ) : (
                                            <ArrowDownUp className="size-3 ml-1" />
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuRadioGroup
                                        value={projectIdActivate ?? undefined}
                                        onValueChange={setActivateProject}
                                    >
                                        {currentProjects.map((project) => (
                                            <DropdownMenuRadioItem key={project._id} value={project._id} disabled={status === 'fetching'}>
                                                {project.name}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
                <div className="flex-1 max-h-flex-1 overflow-hidden">
                    {status === 'fetching' ? (
                        <div className='h-full w-full pt-2 flex justify-center items-center'>
                            <LoaderPage ballSize={3} />
                        </div>
                    ) : (
                        <>
                            {children}
                        </>
                    )}
                </div>
                <TabProject />
            </div>
        </ProjectTabProvider>
    )
}