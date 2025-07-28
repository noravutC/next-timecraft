import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { cva } from "class-variance-authority";
import { ColumnId } from "./KanbanBoard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Paperclip, Plus } from "lucide-react";

export interface Task {
  id: UniqueIdentifier;
  columnId: ColumnId;
  content: string;
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export type TaskType = "Task";

export interface TaskDragData {
  type: TaskType;
  task: Task;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    } satisfies TaskDragData,
    attributes: {
      roleDescription: "Task",
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("rounded-sm bg-white hover:bg-gray-200 flex flex-col gap-4", {
    variants: {
      dragging: {
        over: "ring-1 ring-blue-500 opacity-30",
        overlay: "ring-1 ring-blue-500",
      },
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <div
        className="px-6 py-4 flex items-center justify-between select-none"
        {...attributes}
        {...listeners}
      >
        <span className="text-gray-700 text-sm flex flex-wrap justify-start"> {task.content}</span>
      </div>
      {/* Button Area */}
      <div className="px-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={"ghost"} size={null} className="w-6 h-6 cursor-pointer">
            <Paperclip size={13} />
          </Button>
          <Button variant={"ghost"} size={null} className="w-6 h-6 cursor-pointer">
            <MessageCircle size={13} />
          </Button>
        </div>
        <Avatar className="w-6 h-6 select-none">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
