import { useTaskStore } from "@/hooks";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect, useRef, useState } from "react";

export function TaskCard({ taskId }: { taskId: string }) {
  const task = useTaskStore(s => s.tasks[taskId]);
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!task) return;
    const element = ref.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({
          type: "task",
          taskId,
          columnId: task.columnId,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({
          type: "task",
          taskId,
          columnId: task.columnId,
        }),
      })
    );
  }, [task, taskId]);

  if (!task) return null;

  return (
    <div
      ref={ref}
      className={isDragging ? "opacity-0" : "w-full h-40 rounded-md border shadow-md bg-white p-4"}
    >
      {task.title}
    </div>
  );
}



export function TaskDropZone({
  taskId,
  columnId,
  children,
  disabled,
}: {
  taskId: string;
  columnId: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: "task", taskId, columnId }),
      canDrop: () => !disabled,
    });
  }, [taskId, columnId, disabled]);

  return (
    <div
      ref={ref}
      data-dnd-role="task"
      data-dnd-task-id={taskId}
      data-dnd-column-id={columnId}
    >
      {children}
    </div>
  );
}
