import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Column } from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { TaskCard } from "./task-card";
import { useTaskStore } from "@/hooks/useTasks.hook";
import { Skeleton } from "@/components/ui/skeleton";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PreviewTaskForm } from "./ui-customize/preview-task-form";

interface BoardColumnProps {
  column: Column;
}

export const BoardColumn = ({
  column,
}: BoardColumnProps) => {
  const { fetchTasksByColumnId, getTaskByColumnId, status, tasks: pureTasks } = useTaskStore();
  const [openTaskForm, setOpenTaskForm] = useState(false);
  const [mouseEnterColumn, setMouseEnterColumn] = useState(false);

  const tasks = useMemo(() => {
    if (status === "none") {
      const all = getTaskByColumnId(column?._id);
      return all;
    } else {
      return [];
    }
  }, [column._id, status, pureTasks]);


  const handleOpenTaskForm = () => {
    setOpenTaskForm(!openTaskForm);
  }

  useEffect(() => {
    if (column._id) {
      fetchTasksByColumnId(column._id);
    }
  }, [column._id]);
  return (
    <div
      className="rounded-md h-[55vh] min-w-[250px] max-w-[250px] w-full border overflow-hidden flex flex-col"
      onMouseEnter={() => setMouseEnterColumn(true)}
      onMouseLeave={() => setMouseEnterColumn(false)}
      data-board-column
    >
      {/* Title Column */}
      <div className="border-b p-4 max-h-[40px] h-full flex items-center justify-between">
        <span className={"font-semibold text-sm"}>{column.name}</span>
        <div className="flex gap-2 items-center">
          <div className="rounded-full w-3 h-3"
            style={{
              background: column.color ?? ``,
            }}
          />
          <Badge variant={'outline'} className="rounded-full text-xs bg-white text-gray-500 flex items-center text-start">
            <div>{tasks.length}{column.wipLimit > 0 && `/${column.wipLimit}`}</div>
            {/* Unit */}
            <div>task</div>
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1 h-full w-full overflow-hidden">
        {/* Task */}
        {status !== "none" ? (
          <div className="p-2 flex flex-col gap-2">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-2">
            {openTaskForm && (
              <PreviewTaskForm
                colId={column._id}
                handleOpenTaskForm={handleOpenTaskForm}
              />
            )}
            {tasks.length > 0 && tasks.map((task) => {
              return (
                <TaskCard
                  key={task._id}
                  task={task}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
      <div className="h-[45px] w-full flex items-center justify-start gap-2 cursor-pointer pb-1">
        {mouseEnterColumn && (
          <div className="h-full w-full flex gap-2 items-center rounded m-1 duration-300 transition-all hover:bg-gray-100 px-2"
            onClick={handleOpenTaskForm}
          >
            <Plus size={14} />
            <p className="text-sm font-[500] text-gray-600">Create</p>
          </div>
        )}
      </div>
    </div>
  )
}