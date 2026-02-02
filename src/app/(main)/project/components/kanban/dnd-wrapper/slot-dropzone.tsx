"use client";

import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export type SlotData = {
  type: "slot";
  columnId: string;
  index: number; // 0..N
};

export function SlotDropZone({
  columnId,
  index,
  isOverlay,
  isActive,
}: {
  columnId: string;
  index: number;
  isOverlay?: boolean;
  isActive?: boolean; // ให้ highlight ตอน hover
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isOverlay) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: "slot", columnId, index } satisfies SlotData),
      canDrop: () => !isOverlay,
    });
  }, [columnId, index, isOverlay]);

  // console.log('index: ', index);
  return (
    <div
      ref={ref}
      className={cn(
        "w-full rounded transition-[height,background-color]",
        isActive ? "h-[150px] bg-gray-200" : "h-3 bg-transparent"
      )}
    />
  );
}
