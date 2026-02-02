import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { hexToRgba } from "@/helper/utils";
import { sortObjArray } from "@/helper/utils/sort";
import { useBoardMapStore } from "@/hooks/store";
import { cn } from "@/lib/utils";
import React from "react";

interface BarColumnProps {
    taskAtColumnId: string;
    taskId: string;
}
export const BarColumn = React.memo(({
    taskAtColumnId,
    taskId,
}: BarColumnProps) => {
    const { columnMap } = useBoardMapStore();
    const cols = Object.values(columnMap).map((col) => ({ id: col._id, name: col.name, color: col.color, order: col.order }));
    const sortedCols = sortObjArray(cols, 'order', 'asc');
    // const isActive = columnMap[taskId]?._id;
    const countCol = sortedCols.length;
    const classGridCols = `grid grid-cols-${countCol}`;
    const colActive = columnMap[taskAtColumnId];
    if (!colActive) return null;
    const targetOpacity = 0.75;
    const backgroundStyle = colActive.color ? { background: hexToRgba(colActive.color, targetOpacity) } : {};
    return (
        <div className={cn("w-full max-h-3.5 h-3.5 border bg-gray-100 rounded-full overflow-hidden", countCol > 0 ? classGridCols : '')}>
            {sortedCols.map((col, index) => {
                // const isActive = taskAtColumnId === col.id;
                const isLast = index === countCol - 1;
                const isHilight = col.order <= colActive.order;

                return (
                    <Tooltip key={col.id}>
                        <TooltipTrigger asChild className="cursor-pointer">
                            <div
                                className={cn(
                                    "h-full w-full overflow-hidden transition-colors duration-200",
                                    !isLast && "border-r border-gray-300"
                                )}
                                style={isHilight ? backgroundStyle : undefined}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{col.name}</p>
                        </TooltipContent>
                    </Tooltip>

                );
            })}
        </div>
    );
});