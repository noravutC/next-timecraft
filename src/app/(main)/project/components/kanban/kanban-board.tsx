'use client';

import { useBoardStore, useProjectStore, useUserStore } from '@/hooks';
import React, { useEffect, useMemo } from 'react';
import { BoardColumn } from './board-column';
import { LoaderPage } from '@/components/Loader-page';
import { useRealtimeBoard } from '@/hooks/sync-live-data/useRealtimeBoard';
import { Button } from '@/components/ui/button';
import { BoardTemplate } from '@/components/board-template/board-template';

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
        // groupColumnsOfProjectCache,
        status
    } = useBoardStore();
    const { getProjectById, projects } = useProjectStore();
    const { fetchUsersByIds } = useUserStore();

    useRealtimeBoard(projectId);

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
    const columnInProject = useMemo(() => Object.values(columns).filter((col) => col.projectId === projectId), [columns, projectId]);

    const lastOrderColumn = useMemo(() => {
        return columnInProject.reduce((max, col) => col.order > max ? col.order : max, 0);
    }, [columnInProject]);

    // const kanbanScrollRef = useDragScroll();

    return (
        <>
            {status === "fetching" ? (
                <div className='h-full w-full pt-2 flex justify-center items-center'>
                    <LoaderPage ballSize={3} />
                </div>) : (
                // <div 
                //     ref={kanbanScrollRef} // 👈 ผูก Ref เข้ากับ div นี้
                //     // ปรับ className: เพิ่ม 'cursor-grab' และ 'select-none'
                //     className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto cursor-grab select-none z-1' 
                // >

                <>
                    {columnInProject.length === 0 ? (
                        <>
                            <div className='max-w-full h-fit overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                                <BoardTemplate projectId={projectId} />
                            </div>
                            <div className='flex w-full items-center justify-center gap-2 mt-10'>
                                <Button variant={'secondary'} className='cursor-pointer'>Continue without template</Button>
                                {/* <Button>BoardTemplate</Button> */}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='max-w-full h-full overflow-y-hidden scrollbar-thin-x overflow-x-auto'>
                                <div className='w-full min-w-max flex gap-4 h-full p-4'>
                                    {columnInProject.map((col) => (
                                        <BoardColumn
                                            key={col._id}
                                            column={col}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

        </>
    )
}