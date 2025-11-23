
'use client';

// components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// icons
import { Calendar, EllipsisVertical, User } from "lucide-react";
// types
import { Task } from "@/types";
// utils
import { formatDateToString } from "@/helper/utils";
import { useState } from "react";
import { useBoardStore } from "@/hooks";
import { ColumnBar } from "./ui-customize/column-bar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog } from "@/components/ui/dialog";
import { TaskModal } from "./ui-customize/task-modal";
import { PreviewMembers } from "./task-tab-tools/preview-members";

export interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div key={task._id} className="h-fit w-full border rounded-md p-4 hover:shadow-md transition-shadow duration-200 flex flex-col gap-6">
      <div className="grid grid-cols-5 w-full">
        <div className="col-span-4 flex flex-col gap-1 cursor-pointer" onClick={() => setOpen(true)}>
          <span className="text-sm text-gray-700 font-semibold">{task.title}</span>
        </div>
        <div className="col-span-1 flex justify-end items-start">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" className="p-1 cursor-pointer" size={null}>
                <EllipsisVertical size={10} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">Open tasks</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ColumnBar
        // Bar indicating task's column position
        taskId={task._id}
        taskAtColumnId={task.columnId}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <div className="flex items-center gap-2">
            <Calendar size={13} />
            <p className="text-xs text-gray-500">{task.dueDate ? formatDateToString(task.dueDate) : '-'}</p>
          </div>
        </div>
        <div className="h-fit">
          <PreviewMembers assinees={task.assignees} />
          {task.assignees.length === 0 && (
            <Avatar className="w-6 h-6 select-none">
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AvatarFallback className="border-gray-500"><User className="m-0" size={13} /></AvatarFallback>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Unassigned</p>
                  </TooltipContent>
                </Tooltip>
              </>
            </Avatar>
          )}
        </div>
      </div>
      <TaskModal task={task} open={open} onOpenChange={setOpen} />
    </div>
  );
}
