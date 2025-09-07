import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Column } from "@/types";
import React, { useEffect, useMemo } from "react";
import { TaskCard } from "./task-card";
import { useTaskStore } from "@/hooks/useTasks.hook";

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
    <div className="rounded-md h-[70vh] min-w-[300px] max-w-[20vw] w-full border overflow-hidden">
      {/* Title Column */}
      <div className="border-b p-4 max-h-[60px] h-full flex items-center justify-between">
        <span className="font-semibold text-md">{column.name}</span>
        <div className="flex gap-2 items-center">
          <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start">
            <div>{tasks.length}</div>
            {/* Unit */}
            <div>task</div>
          </Badge>
        </div>
      </div>
      <ScrollArea className="max-h-[calc(70vh-60px)] h-full w-full overflow-hidden" >
        {/* Task */}
        {status !== "none" ? (
          <div>Loading...</div>
        ) : (
          <div className="p-4 flex flex-col gap-4">

            {tasks.length > 0 ? tasks.map((task) => {
              return (
                <TaskCard key={task._id} task={task} />
              );
            }) :
              (
                <div className="w-full">Empty</div>
              )
            }
          </div>
        )}
      </ScrollArea>
    </div>
  )
}