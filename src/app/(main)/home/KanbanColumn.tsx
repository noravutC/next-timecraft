import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { Column, Task } from "@/types/kanban";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const colorClasses: Record<string, string> = {
  purple: "bg-[hsl(var(--column-purple))]",
  pink: "bg-[hsl(var(--column-pink))]",
  blue: "bg-[hsl(var(--column-blue))]",
  yellow: "bg-[hsl(var(--column-yellow))]",
  green: "bg-[hsl(var(--column-green))]",
  indigo: "bg-[hsl(var(--column-indigo))]",
  orange: "bg-[hsl(var(--column-orange))]",
  teal: "bg-[hsl(var(--column-teal))]",
};

export function KanbanColumn({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
  onDeleteColumn,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="flex-shrink-0 w-80"
    >
      <Card className="bg-muted/30 border-border h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2 group">
          <button
            className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className={`w-2 h-2 rounded-full ${colorClasses[column.color]}`} />
          <h3 className="font-semibold text-foreground flex-1">{column.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDeleteColumn(column.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        
        <div
          ref={setDroppableRef}
          className="flex-1 p-4 overflow-y-auto min-h-[200px]"
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => onAddTask(column.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </Card>
    </div>
  );
}
