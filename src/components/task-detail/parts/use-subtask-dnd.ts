'use client';

import { useEffect, useState, type RefObject } from 'react';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { dropFraction } from '@/helper/utils/subtask-order';
import { useSubtaskStore } from '@/store/use-subtask.store';

export const SUBTASK_DRAG = 'subtask';

export type SubtaskDragData = {
  type: typeof SUBTASK_DRAG;
  id: string;
  taskId: string;
};

export const isSubtaskDrag = (
  data: Record<string | symbol, unknown>,
): data is SubtaskDragData => data.type === SUBTASK_DRAG;

/** One subtask row as a drag source (by its handle) and a drop target. */
export function useSubtaskDnd(args: {
  id: string;
  taskId: string;
  enabled: boolean;
  rowRef: RefObject<HTMLElement | null>;
  handleRef: RefObject<HTMLElement | null>;
}) {
  const { id, taskId, enabled, rowRef, handleRef } = args;
  const [edge, setEdge] = useState<Edge | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const element = rowRef.current;
    const handle = handleRef.current;
    if (!enabled || !element || !handle) return;
    const data: SubtaskDragData = { type: SUBTASK_DRAG, id, taskId };
    return combine(
      draggable({
        element,
        dragHandle: handle,
        getInitialData: () => data,
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          isSubtaskDrag(source.data) &&
          source.data.taskId === taskId &&
          source.data.id !== id,
        getData: ({ input }) =>
          attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['top', 'bottom'],
          }),
        onDrag: ({ self }) => setEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setEdge(null),
        onDrop: () => setEdge(null),
      }),
    );
  }, [id, taskId, enabled, rowRef, handleRef]);

  return { edge, dragging };
}

/** A subtask dropped on another's top or bottom edge moves there. */
export function useSubtaskReorder(
  taskId: string,
  move: (subtaskId: string, orderFraction: string) => void,
) {
  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) =>
          isSubtaskDrag(source.data) && source.data.taskId === taskId,
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets[0];
          if (!target || !isSubtaskDrag(source.data)) return;
          if (!isSubtaskDrag(target.data)) return;
          const edge = extractClosestEdge(target.data);
          if (edge !== 'top' && edge !== 'bottom') return;
          const items = useSubtaskStore.getState().byTask[taskId]?.items ?? [];
          const orderFraction = dropFraction(
            items,
            source.data.id,
            target.data.id,
            edge,
          );
          if (orderFraction) move(source.data.id, orderFraction);
        },
      }),
    [taskId, move],
  );
}
