
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
import { Calendar, EllipsisVertical } from "lucide-react";
// types
import { Task } from "@/types";
// utils
import { formatDateToString } from "@/helper/utils";
import { useState } from "react";
import { TaskModal } from "./components/task-modal";

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
              <Button variant="ghost" className="p-1" size={null}>
                <EllipsisVertical size={10} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start gap-2">
          <Badge variant={'outline'} className="rounded-full text-xs">
            status
          </Badge>
          <div className="text-xs flex gap-2 text-gray-500">
            <Calendar size={13} />
            {task.dueDate ? formatDateToString(task.dueDate) : 'No due date'}
          </div>
        </div>
        <div>
          <Avatar className="w-6 h-6 select-none">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <TaskModal taskId={task._id} taskTitle={task.title} open={open} onOpenChange={setOpen} />
    </div>
  );
}
