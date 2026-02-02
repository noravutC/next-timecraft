'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useBoardStore, useTaskStore } from "@/hooks";
import { useShallow } from "zustand/react/shallow";
import { TaskCard } from "./task-dnd";
import { cn } from "@/lib/utils";
import { SlotDropZone } from "./slot-dropzone";


interface BoardColumnProps {
  columnId: string;
  ghostAt?: {
    activeId: string;
    columnId: string;
    index: number;
  } | null;
  activeTaskId?: string | null;

  isOverlay?: boolean;
}

export const BoardColumn = React.memo(({ columnId, ghostAt, activeTaskId, isOverlay }: BoardColumnProps) => {
  const column = useBoardStore(useShallow(state => state.columns[columnId]));
  const tasks = useTaskStore(useShallow(state => state.tasks));
  const activeTask = activeTaskId ? tasks[activeTaskId] : null;
  const [isDragging, setIsDragging] = useState(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const taskIds = useMemo(() => {
    return Object.values(tasks)
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.order - b.order)
      .map(task => task._id);
  }, [tasks, columnId]);

  useEffect(() => {
    if (!column) return;
    const element = columnRef.current;
    const dragHandle = headerRef.current;
    if (!element || !dragHandle || isOverlay) return;

    return combine(
      draggable({
        element,
        dragHandle,
        getInitialData: () => ({ type: "column", columnId }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ type: "column", columnId }),
        canDrop: () => !isOverlay,
      })
    );
  }, [column, columnId, isOverlay]);

  if (!column) return null;

  const ghostTaskId = ghostAt?.activeId;

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex max-h-[500px] max-w-[350px] w-full h-fit flex-col rounded-lg bg-secondary/50 border-2 overflow-x-hidden",
        isDragging && "opacity-60"
      )}
    >
      <div
        ref={headerRef}
        className="flex items-center justify-between p-4 cursor-grab font-bold bg-secondary/20 rounded-t-lg"
      >
        <span className="flex items-center gap-2">
          {column.name}
          <span className="text-xs font-normal text-gray-400">({taskIds.length})</span>
        </span>
      </div>

      <div
        className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-thin-y overflow-x-hidden p-2"
      >
        {taskIds.map((taskId, i) => {
          const hideTaskCard =
            ghostTaskId === taskId ||
            (activeTask?.columnId === columnId && activeTaskId === taskId);

          return (
            <React.Fragment key={taskId}>
              <SlotDropZone
                columnId={columnId}
                index={i}
                isOverlay={isOverlay}
                isActive={!isOverlay && ghostAt?.index === i && !!ghostTaskId}
              />
              {!hideTaskCard && <TaskCard taskId={taskId} />}
            </React.Fragment>
          );
        })}
        <SlotDropZone
          columnId={columnId}
          index={taskIds.length}
          isOverlay={isOverlay}
          isActive={!isOverlay && ghostAt?.index === taskIds.length && !!ghostTaskId}
        />
      </div>
    </div>
  );
});
