import React from "react";
import { useColumnStore, useTaskStore } from "@/hooks";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ColumnBarProps {
    taskId: string;
    taskAtColumnId: string;
}
export const ColumnBar = ({
    taskId,
    taskAtColumnId,
}: ColumnBarProps) => {
    const { columns } = useColumnStore();
    const { moveTaskToColumn } = useTaskStore();
    const tempColumns = Object.values(columns).sort((a, b) => a.order - b.order);
    const lengthColumns = tempColumns.length;

    const onMoveTaskToColumn = (destinationColumnId: string) => {
        moveTaskToColumn(taskId, destinationColumnId);
    }
    const orderColActive = columns[taskAtColumnId]?.order;
    const colorColActive = columns[taskAtColumnId]?.color;
    return (
        <div className="w-full h-3 grid grid-cols-6 rounded-full bg-gray-100 overflow-hidden">
            {tempColumns.map((col, index) => {
                const isActive = taskAtColumnId === col._id;
                const isLast = index === lengthColumns - 1;
                return (
                    <Tooltip key={col._id}>
                        <TooltipTrigger asChild className="cursor-pointer" onClick={() => onMoveTaskToColumn(col._id)}>
                            <div
                                className={cn(
                                    "h-full w-full transition-colors duration-200",
                                    !isLast && "border-r-2 border-gray-200"
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