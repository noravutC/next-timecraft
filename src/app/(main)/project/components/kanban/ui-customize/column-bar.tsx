'use client';

import React, { useEffect, useMemo } from "react";
import { useBoardStore, useProjectStore, useTaskStore } from "@/hooks";
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
export const ColumnBar = ({
    disabled = false,
    taskId,
    taskAtColumnId,
}: ColumnBarProps) => {
    const { projectIdActivate, getProjectById } = useProjectStore();
    if (!projectIdActivate)
        return null;
    const { columns, columnsBarOfProjectCache } = useBoardStore();
    const { moveTaskToColumn } = useTaskStore();
    // const tempColumns = Object.values(columns).sort((a, b) => a.order - b.order);


    const onMoveTaskToColumn = (destinationColumnId: string) => {
        moveTaskToColumn(projectIdActivate, taskId, destinationColumnId);
    }

    const { tempColumns, orderColActive, colorColActive } = useMemo(() => {
        const columnsOfProject = columnsBarOfProjectCache[projectIdActivate].columns;
        const colActive = columnsOfProject.find((col) => col._id === taskAtColumnId);
        return {
            tempColumns: columnsOfProject.sort((a, b) => a.order - b.order),
            orderColActive: colActive?.order ?? 0,
            colorColActive: colActive?.color,
        };

    }, [columnsBarOfProjectCache, taskAtColumnId]);

    const lengthColumns = tempColumns.length;

    return (
        <div className="w-full min-h-[13px] max-h-[13px] grid grid-cols-6 rounded-full bg-gray-100 overflow-hidden border border-gray-300">
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
}