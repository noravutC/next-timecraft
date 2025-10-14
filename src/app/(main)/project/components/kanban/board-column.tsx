import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Column } from "@/types";
import React, { useEffect, useMemo } from "react";
import { TaskCard } from "./task-card";
import { useTaskStore } from "@/hooks/useTasks.hook";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
  column: Column;
}

export const BoardColumn = ({
  column,
}: BoardColumnProps) => {
  const { fetchTasksByColumnId, getTaskByColumnId, status } = useTaskStore();
  useEffect(() => {
    if (column) {
      fetchTasksByColumnId(column._id);
    }
  }, [column]);
  const tasks = getTaskByColumnId(column?._id);
  return (
    <div className="rounded-md h-[55vh] min-w-[250px] max-w-[250px] w-full border overflow-hidden">
      {/* Title Column */}
      <div className="border-b p-4 max-h-[40px] h-full flex items-center justify-between">
        <span className={"font-semibold text-sm"}>{column.name}</span>
        <div className="flex gap-2 items-center">
          <div className="rounded-full w-3 h-3"
            style={{
              background: column.color ?? `` ,
            }}
          />
          <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start">
            <div>{tasks.length}/{column.wipLimit}</div>
            {/* Unit */}
            <div>task</div>
          </Badge>
        </div>
      </div>
      <ScrollArea className="max-h-[calc(60vh-60px)] h-full w-full overflow-hidden" onWheel={() => { }} >
        {/* Task */}
        {status !== "none" ? (
          <div className="p-2 flex flex-col gap-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-2">

            {tasks.length > 0 && tasks.map((task) => {
              return (
                <TaskCard key={task._id} task={task} />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}