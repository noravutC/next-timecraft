"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from 'next/navigation';
// hooks
import { useProjectStore } from '@/src/hooks/useProjects';
// components
import { PreviewProvider } from './test-components/preview-context';
import Board from './test-components/board';
import { KanbanBoard } from "./components/KanbanBoard";
// types
// import { type Projects } from "@/src/types/";
// import { Button } from "@/components/ui/button";
import { SectionWrapper } from "@/components/wrapper/section-wrapper";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.projectId as string | undefined;
    const { getProjectById, fetchProjectById } = useProjectStore();
    const [loader, setLoader] = useState<boolean>(false);
    // const project = getProjectById(projectId ?? "");
    const project = useProjectStore((state) => state.projects[projectId ?? ""]);
    const projectMapColTasks = useMemo(() => {
        if (!project) return { columns: [], tasks: [] };
        const column = project.columns.map((column) => ({
            id: String(column.column_id),
            title: column.column_name,
        }));
        const task = project.columns.flatMap((column) =>
            column.tasks.map((task) => ({
                id: String(task.task_id),
                columnId: String(column.column_id),
                content: task.task_title,
            }))
        );
        return { columns: column, tasks: task };
    }, [project]);

    useEffect(() => {
        fetchProjectById(projectId ?? '');
    }, []);

    return (
        <>
            {loader ? (
                <div>Loading...</div>
            ) : (
                <>
                    {project && (
                        <SectionWrapper menu={"Projects"} subHeading={project.project_name}>
                            <div className="flex flex-col">

                            </div>
                            <PreviewProvider>
                                <Board columns={projectMapColTasks.columns} tasks={projectMapColTasks.tasks} />
                            </PreviewProvider>
                            {/* <KanbanBoard
                                projectId={projectId ?? ""}
                                defualtColumns={projectMapColTasks.columns}
                                defaultTasks={projectMapColTasks.tasks}
                            /> */}
                        </SectionWrapper>
                    )}
                </>
            )}
        </>
    );
}
