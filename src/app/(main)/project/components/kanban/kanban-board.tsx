'use client';

import { useBoardStore, useProjectStore, useUserStore } from '@/hooks';
import React, { useEffect, useMemo, useState } from 'react';
// import { BoardColumn } from './board-column';
import { LoaderPage } from '@/components/Loader-page';
import { useRealtimeBoard } from '@/hooks/sync-live-data/useRealtimeBoard';
import { Button } from '@/components/ui/button';
import { BoardTemplate } from '@/components/board-template/board-template';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import LogoAnimationLoop from '@/components/logo-space/logo-animation-loop';
import { BoardDnd } from './dnd-wrapper/board-dnd';

interface KanbanBoardProps {
    projectId: string | null | undefined;
}

export const KanbanBoard = ({
    projectId,
}: KanbanBoardProps) => {
    const {
        fetchBoardByProjectId,
        clearColumns,
        columns,
        status
    } = useBoardStore();
    const { getProjectById, projects } = useProjectStore();
    const { fetchUsersByIds } = useUserStore();

    useRealtimeBoard(projectId);

    const columnInProject = useMemo(() => Object.values(columns).filter((col) => col.projectId === projectId), [columns, projectId]);
    const sortedColumns = useMemo(
        () => {
            return columnInProject.sort((a, b) => a.order - b.order);
        },
        [columns]
    );

    useEffect(() => {
        if (projectId) {
            // clearColumns();
            fetchBoardByProjectId(projectId);

            const projectNow = getProjectById(projectId);
            if ((projectNow?.members ?? []).length > 0) {
                const userIds: string[] = (projectNow?.members ?? []).map((m) => m.userId).filter((item) => item !== undefined);
                fetchUsersByIds(userIds);
            }
        }
    }, [projectId, clearColumns, projects]);
    if (!projectId) return null;
    return (
        <>
            {status === "fetching" ? (
                <div className='h-full w-full pt-2 flex justify-center items-center'>
                    {/* <LoaderPage ballSize={3} /> */}
                    <LogoAnimationLoop />
                </div>) : (
                <>
                    {sortedColumns.length === 0 ? (
                        <>
                            <div className='max-w-full h-fit overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                                <BoardTemplate projectId={projectId} />
                            </div>
                            <div className='flex w-full items-center justify-center gap-2 mt-10'>
                                <Button variant={'secondary'} className='cursor-pointer'>Continue without template</Button>
                            </div>
                        </>
                    ) : (
                        <>
                        <BoardDnd projectId={projectId} />
                            {/* <div className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                                <div className='w-full min-w-max flex gap-6 h-full p-4'>
                                    {sortedColumns.map((col) => (
                                        <BoardColumn key={col._id} column={col} />
                                    ))}
                                </div>
                            </div> */}
                        </>
                    )}
                </>
            )}

        </>
    )
}