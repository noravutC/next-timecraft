import { DragData } from "@/types/kanban";
import { Active, DataRef, Over } from "@dnd-kit/core";
// import { ColumnDragData } from "./BoardColumn";
// import { TaskDragData } from "./TaskCard";

// type DraggableData = ColumnDragData | TaskDragData;

export function hasDraggableData<T extends Active | Over>(
  entry: T | null | undefined
): entry is T & {
  data: DataRef<DragData>;
} {
  if (!entry) {
    return false;
  }

  const data = entry.data.current;

  if (data?.type === "column" || data?.type === "task") {
    return true;
  }

  return false;
}

export type Point = { x: number; y: number };

export function getPointerCoordinates(e: unknown): Point | null {
  if (!e || typeof e !== "object") return null;

  // MouseEvent / PointerEvent
  if ("clientX" in e && "clientY" in e) {
    return {
      x: (e as MouseEvent).clientX,
      y: (e as MouseEvent).clientY,
    };
  }

  // TouchEvent
  if ("touches" in e) {
    const t = (e as TouchEvent).touches[0] ?? (e as TouchEvent).changedTouches?.[0];
    if (t) {
      return { x: t.clientX, y: t.clientY };
    }
  }

  return null;
}
