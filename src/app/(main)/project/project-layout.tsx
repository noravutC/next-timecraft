// project/project-tools-layout.tsx
'use client';

import React, { useEffect, useMemo, useState } from "react";
// components
import { TabProject } from "./components/tab-project";
// store
import { useProjectStore } from "@/store";

// utils
import { ProjectTabProvider } from "@/context/project/project-menu-context";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";
import { CreateFirstProject } from "./components/create-first-project";
import { useSession } from "next-auth/react";
import { ProjectHeader } from "./project-header";

export const ProjectToolsLayout = ({ children }: { children: React.ReactNode }) => {
    const { fetchProjects, projects, status, needCreateProject, projectIsUsing, setProjectIsUsing } = useProjectStore();
    const projectList = Object.values(projects);
    const selectedProject = projectIsUsing ? projects[projectIsUsing] : projectList[0] ?? null;
    // const firstProject = projectList[0] ?? null;

    useEffect(() => {
        fetchProjects([], true);
    }, []);

    useEffect(() => {
        if (!needCreateProject && Object.keys(projects).length > 0) {
            setProjectIsUsing(Object.keys(projects)[0]);
        }
    }, [needCreateProject, projects]);

    return (
        <ProjectTabProvider>
            <div className="relative max-w-full w-full h-full overflow-x-hidden flex flex-col">
                {needCreateProject ? (
                    <CreateFirstProject />
                ) : (
                    <>
                        <div className="min-h-10 w-full grid grid-cols-3 overflow-hidden">
                            <ProjectHeader selectedProject={selectedProject} />
                        </div>
                        <div className="flex-1 max-h-flex-1 overflow-hidden">
                            {status === 'fetching' ? (
                                <div className='h-full w-full pt-2 flex justify-center items-center'>
                                    <LogoAnimationLoop />
                                </div>
                            ) : (
                                <>
                                    {/* {needCreateProject ? (
                                        <>
                                            <CreateFirstProject />
                                        </>
                                    ) : (
                                        <>
                                        </>
                                    )} */}
                                    {children}
                                </>
                            )}
                        </div>
                    </>
                )}
                <TabProject />
            </div>
        </ProjectTabProvider>
    )
}