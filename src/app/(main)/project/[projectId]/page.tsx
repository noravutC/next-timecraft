"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from 'next/navigation';
// hooks
import { useProjectStore } from '@/hooks/useProjects.hook';
// components
import { KanbanBoard } from "./kanban-board";
// types
import { SectionWrapper } from "@/components/wrapper/section-wrapper";
import { LoaderPage } from "@/components/Loader-page";


export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.projectId as string | undefined;
    const { getProjectById, fetchProjectById } = useProjectStore();
    const [loader, setLoader] = useState<boolean>(false);
    const project = getProjectById(projectId ?? "");

    useEffect(() => {
        fetchProjectById(projectId ?? '');
    }, [projectId])

    return (
        <>
            {loader ? (
                <div className="w-full h-full flex items-center justify-center">
                    <LoaderPage />
                </div>
            ) : (
                <>
                    {project && (
                        <SectionWrapper menu="Projects" subHeading={project.name}>
                            <div></div>
                            <KanbanBoard
                                project={project}
                            // defualtColumns={projectMapColTasks.columns}
                            // defaultTasks={projectMapColTasks.tasks}
                            />
                        </SectionWrapper>
                    )}
                </>
            )}
        </>
    );
}
