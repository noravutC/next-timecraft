// project/project-tools-layout.tsx
'use client';

import React, { useEffect } from "react";
// components
import { TabProject } from "./components/tab-project";
// hooks
import { useProjectStore } from "@/hooks";
// utils
import { ProjectTabProvider } from "@/context/project/project-menu-context";
import { ProjectToolsMenu } from "./components/project-tools/project-tools";
import LogoAnimationLoop from "@/components/logo-space/logo-animation-loop";
import { CreateFirstProject } from "./components/create-first-project";
// import { useSession } from "next-auth/react";

export const ProjectToolsLayout = ({ children }: { children: React.ReactNode }) => {
    // const { data: session } = useSession();
    const {
        fetchProjects,
        status,
        projects,
    } = useProjectStore();

    const isFirstProject = Object.values(projects).length < 1;

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <ProjectTabProvider>
            <div className="relative max-w-full w-full h-full overflow-x-hidden flex flex-col">
                <div className="max-h-[60px] min-h-[60px] w-full flex justify-start items-center overflow-hidden">
                    <div className="flex flex-col w-full">
                        <div className="flex items-center gap-4 pl-4">
                            {/* Top menu tools */}
                            {!isFirstProject && (
                                <ProjectToolsMenu />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 max-h-flex-1 overflow-hidden">
                    {status === 'fetching' ? (
                        <div className='h-full w-full pt-2 flex justify-center items-center'>
                            <LogoAnimationLoop />
                        </div>
                    ) : (
                        <>
                            {isFirstProject ? (
                                <>
                                    <CreateFirstProject />
                                </>
                            ) : (
                                <>
                                    {children}
                                </>
                            )}
                        </>
                    )}
                </div>
                {/* Bottom menu tools */}
                {!isFirstProject && (
                    <TabProject />
                )}
            </div>
        </ProjectTabProvider>
    )
}