'use client';

import React, { useMemo } from "react";
import { useBoardStore, useProjectStore, useTaskStore } from "@/hooks";
import { useShallow } from 'zustand/react/shallow';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ColumnBarProps {
    disabled?: boolean;
    taskId: string;
    taskAtColumnId: string;
}
export const ColumnBar = React.memo(({
    disabled = false,
    taskId,
    taskAtColumnId,
}: ColumnBarProps) => {
    const { projectIdActivate } = useProjectStore();

    const columnsBarOfProjectCache = useBoardStore(
        useShallow(state => state.columnsBarOfProjectCache)
    );
    const columnCombineTasks = useBoardStore(
        useShallow(state => state.columnCombineTasks)
    );
    const moveTaskTo = useTaskStore(state => state.moveTaskTo);
    const moveTaskState = useTaskStore(state => state.moveTaskState);

    const { tempColumns, orderColActive, colorColActive } = useMemo(() => {
        const projectData = columnsBarOfProjectCache[projectIdActivate ?? ''] ?? undefined;
        if (!projectData || !projectData.columns) {
            return { tempColumns: [], orderColActive: 0, colorColActive: '' };
        }

        const columnsOfProject = projectData.columns;
        const colActive = columnsOfProject.find((col) => col._id === taskAtColumnId);

        return {
            tempColumns: [...columnsOfProject].sort((a, b) => a.order - b.order),
            orderColActive: colActive?.order ?? 0,
            colorColActive: colActive?.color,
        };
        // แก้ไข 3: เพิ่ม Dependency ให้ครบ
    }, [columnsBarOfProjectCache, taskAtColumnId, projectIdActivate]);

    if (!projectIdActivate)
        return null;
    const onMoveTaskToColumn = (destinationColumnId: string) => {
        if (destinationColumnId === taskAtColumnId) return;
        const destinationTasks = columnCombineTasks[destinationColumnId]?.tasks ?? [];
        const lastOrder = destinationTasks.length > 0
            ? Math.max(...destinationTasks.map((t) => t.order))
            : 0;
        const destinationOrder = lastOrder + 1;
        moveTaskState(taskId, destinationColumnId, null);
        moveTaskTo(projectIdActivate, taskId, taskAtColumnId, destinationColumnId, destinationOrder);
    }
    const lengthColumns = tempColumns.length;

    return (
        <div className={cn("w-full min-h-[13px] max-h-[13px] grid rounded-full bg-gray-100 overflow-hidden border border-gray-300",
            lengthColumns > 0 && "grid-cols-" + lengthColumns
        )}>
            {tempColumns.map((col, index) => {
                const isActive = taskAtColumnId === col._id;
                const isLast = index === lengthColumns - 1;
                return (
                    <Tooltip key={col._id}>
                        <TooltipTrigger asChild className="cursor-pointer" onClick={() => disabled ? undefined : onMoveTaskToColumn(col._id)}>
                            <div
                                className={cn(
                                    "h-full w-full transition-colors duration-200",
                                    !isLast && "border-r border-gray-300"
                                )}
                                style={{
                                    backgroundColor: (isActive || col.order <= orderColActive) ? colorColActive : "transparent",
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{col.name}</p>
                        </TooltipContent>
                    </Tooltip>

                );
            })}
        </div>
    )
})
