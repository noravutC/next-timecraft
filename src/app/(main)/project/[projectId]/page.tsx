"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from 'next/navigation';
// hooks
import { useProjectStore } from '@/hooks/useProjects.hook';
// components
import { KanbanBoard } from "./kanban-board";
// types
import { SectionWrapper } from "@/components/wrapper/section-wrapper";


export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.projectId as string | undefined;
    const { getProjectById } = useProjectStore();
    const [loader, setLoader] = useState<boolean>(false);
    const project = getProjectById(projectId ?? "");


    return (
        <>
            {loader ? (
                <div>Loading...</div>
            ) : (
                <>
                    {project ? (
                        <SectionWrapper menu="Projects" subHeading={project.name}>
                            <div></div>
                            <KanbanBoard
                                project={project}
                                // defualtColumns={projectMapColTasks.columns}
                                // defaultTasks={projectMapColTasks.tasks}
                            />
                        </SectionWrapper>
                    ) : (
                        <div>Loading...</div>
                    )}
                </>
            )}
        </>
    );
}
