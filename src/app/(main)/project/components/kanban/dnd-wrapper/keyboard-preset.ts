import {
  closestCorners,
  getFirstCollision,
  KeyboardCode,
  DroppableContainer,
  KeyboardCoordinateGetter,
} from "@dnd-kit/core";

type RectShape = { left: number; top: number; width: number; height: number };

function centerOfRect(rect: RectShape) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

type DndData =
  | { type: "task"; columnId: string }
  | { type: "column"; columnId: string };

function readData(entry: DroppableContainer): DndData | null {
  const cur = entry.data.current as any;
  if (!cur || typeof cur !== "object") return null;

  const type = cur.type;
  const columnId = cur.columnId;

  if ((type !== "task" && type !== "column") || typeof columnId !== "string") return null;

  return { type, columnId };
}

const directionCodes = new Set<string>([
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
]);

export const coordinateGetter: KeyboardCoordinateGetter = (
  event,
  { context: { active, droppableRects, droppableContainers, collisionRect } }
) => {
  if (!directionCodes.has(event.code)) return undefined;
  event.preventDefault();

  if (!active || !collisionRect) return undefined;

  const activeType = (active.data.current as any)?.type as "task" | "column" | undefined;
  const activeColumnId = (active.data.current as any)?.columnId as string | undefined;

  const collisionCenter = centerOfRect(collisionRect as RectShape);

  const candidates: DroppableContainer[] = [];

  droppableContainers.getEnabled().forEach((entry) => {
    if (!entry || entry.disabled) return;

    const rect = droppableRects.get(entry.id);
    if (!rect) return;

    const data = readData(entry);
    if (!data) return;

    const c = centerOfRect(rect as RectShape);

    // Task rules
    if (activeType === "task") {
      if (event.code === KeyboardCode.Up || event.code === KeyboardCode.Down) {
        if (data.type !== "task") return;
        if (activeColumnId && data.columnId !== activeColumnId) return;
      }
    }

    // Column rules
    if (activeType === "column") {
      if (event.code === KeyboardCode.Up || event.code === KeyboardCode.Down) return;
      if (data.type !== "column") return;
    }

    switch (event.code) {
      case KeyboardCode.Down:
        if (c.y > collisionCenter.y) candidates.push(entry);
        break;
      case KeyboardCode.Up:
        if (c.y < collisionCenter.y) candidates.push(entry);
        break;
      case KeyboardCode.Left:
        if (c.x < collisionCenter.x) candidates.push(entry);
        break;
      case KeyboardCode.Right:
        if (c.x > collisionCenter.x) candidates.push(entry);
        break;
    }
  });

  const collisions = closestCorners({
    active,
    collisionRect,
    droppableRects,
    droppableContainers: candidates,
    pointerCoordinates: null,
  });

  const closestId = getFirstCollision(collisions, "id");
  if (!closestId) return undefined;

  const target = droppableContainers.get(closestId);
  const targetRect = target?.rect.current;
  if (!targetRect) return undefined;

  const targetCenter = centerOfRect(targetRect as RectShape);
  return targetCenter;
};

// import {
//   closestCorners,
//   getFirstCollision,
//   KeyboardCode,
//   DroppableContainer,
//   KeyboardCoordinateGetter,
// } from "@dnd-kit/core";

// const directions: string[] = [
//   KeyboardCode.Down,
//   KeyboardCode.Right,
//   KeyboardCode.Up,
//   KeyboardCode.Left,
// ];

// export const coordinateGetter: KeyboardCoordinateGetter = (
//   event,
//   { context: { active, droppableRects, droppableContainers, collisionRect } }
// ) => {
//   if (directions.includes(event.code)) {
//     event.preventDefault();

//     if (!active || !collisionRect) {
//       return;
//     }

//     const filteredContainers: DroppableContainer[] = [];

//     droppableContainers.getEnabled().forEach((entry) => {
//       if (!entry || entry?.disabled) {
//         return;
//       }

//       const rect = droppableRects.get(entry.id);

//       if (!rect) {
//         return;
//       }

//       const data = entry.data.current;

//       if (data) {
//         const { type, children } = data;

//         if (type === "Column" && children?.length > 0) {
//           if (active.data.current?.type !== "Column") {
//             return;
//           }
//         }
//       }

//       switch (event.code) {
//         case KeyboardCode.Down:
//           if (active.data.current?.type === "Column") {
//             return;
//           }
//           if (collisionRect.top < rect.top) {
//             // find all droppable areas below
//             filteredContainers.push(entry);
//           }
//           break;
//         case KeyboardCode.Up:
//           if (active.data.current?.type === "Column") {
//             return;
//           }
//           if (collisionRect.top > rect.top) {
//             // find all droppable areas above
//             filteredContainers.push(entry);
//           }
//           break;
//         case KeyboardCode.Left:
//           if (collisionRect.left >= rect.left + rect.width) {
//             // find all droppable areas to left
//             filteredContainers.push(entry);
//           }
//           break;
//         case KeyboardCode.Right:
//           // find all droppable areas to right
//           if (collisionRect.left + collisionRect.width <= rect.left) {
//             filteredContainers.push(entry);
//           }
//           break;
//       }
//     });
//     const collisions = closestCorners({
//       active,
//       collisionRect: collisionRect,
//       droppableRects,
//       droppableContainers: filteredContainers,
//       pointerCoordinates: null,
//     });
//     const closestId = getFirstCollision(collisions, "id");

//     if (closestId != null) {
//       const newDroppable = droppableContainers.get(closestId);
//       const newNode = newDroppable?.node.current;
//       const newRect = newDroppable?.rect.current;

//       if (newNode && newRect) {
//         return {
//           x: newRect.left,
//           y: newRect.top,
//         };
//       }
//     }
//   }

//   return undefined;
// };

// type Point = { x: number; y: number };

// export function getPointerCoordinates(e: unknown): Point | null {
//   if (!e || typeof e !== "object") return null;

//   // PointerEvent / MouseEvent
//   if ("clientX" in e && "clientY" in e) {
//     const { clientX, clientY } = e as { clientX: number; clientY: number };
//     return { x: clientX, y: clientY };
//   }

//   // TouchEvent
//   if ("touches" in e) {
//     const te = e as TouchEvent;
//     const t = te.touches?.[0] ?? te.changedTouches?.[0];
//     if (t) return { x: t.clientX, y: t.clientY };
//   }

//   return null;
// }
