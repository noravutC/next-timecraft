import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/kanban";

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 mb-3 bg-card hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
