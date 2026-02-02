'use client';

import React from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useEffect, useRef } from "react";

export function TaskDropZone({
  taskId,
  columnId,
  children,
  isOverlay,
}: {
  taskId: string;
  columnId: string;
  children: React.ReactNode;
  isOverlay?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isOverlay) return;

    return dropTargetForElements({
      element,
      getData: () => ({
        type: "task",
        taskId,
        columnId,
      }),
      canDrop: () => !isOverlay,
    });
  }, [taskId, columnId, isOverlay]);

  return (
    <div ref={ref}>
      {children}
    </div>
  );
}
