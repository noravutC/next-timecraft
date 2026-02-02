'use client';

import { autoScroller } from '@atlaskit/pragmatic-drag-and-drop-react-beautiful-dnd-autoscroll';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBoardStore, useTaskStore } from '@/hooks';
import { useShallow } from 'zustand/react/shallow';
import { BoardColumn } from './board-column';

export type GhostAt = {
  activeId: string;
  columnId: string;
  index: number;
};

type DragSourceData =
  | { type: 'task'; taskId: string; columnId: string }
  | { type: 'column'; columnId: string };

type DropTargetData =
  | { type: 'slot'; columnId: string; index: number }
  | { type: 'task'; columnId: string; taskId: string }
  | { type: 'column'; columnId: string };

type DropTargetRecord = {
  element?: HTMLElement;
  data?: DropTargetData;
};

interface BoardDndProps {
  projectId: string;
}

export const BoardDnd = ({ projectId }: BoardDndProps) => {
  const columns = useBoardStore(useShallow((state) => state.columns));
  const tasks = useTaskStore(useShallow((state) => state.tasks));
  const moveTaskState = useTaskStore((state) => state.moveTaskState);
  const moveTaskTo = useTaskStore((state) => state.moveTaskTo);
  const updateColumnOrder = useBoardStore((state) => state.updateColumnOrder);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [ghostAt, setGhostAt] = useState<GhostAt | null>(null);
  const lastGhostRef = useRef<GhostAt | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef(tasks);
  const columnsRef = useRef(columns);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const columnList = useMemo(
    () => Object.values(columns).sort((a, b) => a.order - b.order),
    [columns]
  );
  const columnIds = useMemo(() => columnList.map((col) => col._id), [columnList]);

  const getTaskIdsByColumn = useCallback((columnId: string) => {
    return Object.values(tasksRef.current)
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.order - b.order)
      .map((task) => task._id);
  }, []);

  const findDropTarget = useCallback(
    (dropTargets: DropTargetRecord[], type: DropTargetData['type']) =>
      dropTargets.find((target) => target?.data?.type === type),
    []
  );

  const resolveTaskDrop = useCallback(
    (dropTargets: DropTargetRecord[], pointer: { clientY?: number } | null) => {
      const slotTarget = findDropTarget(dropTargets, 'slot');
      if (slotTarget?.data?.type === 'slot') {
        return {
          columnId: slotTarget.data.columnId,
          dropIndexRaw: slotTarget.data.index,
        };
      }

      const taskTarget = findDropTarget(dropTargets, 'task');
      if (taskTarget?.data?.type === 'task') {
        const { columnId, taskId } = taskTarget.data;
        const taskIds = getTaskIdsByColumn(columnId);
        const overIndex = taskIds.findIndex((id) => id === taskId);
        if (overIndex >= 0) {
          const rect = taskTarget.element?.getBoundingClientRect?.();
          const pointerY = pointer?.clientY;
          const isBelow =
            rect && typeof pointerY === 'number'
              ? pointerY > rect.top + rect.height / 2
              : false;
          return {
            columnId,
            dropIndexRaw: Math.min(
              taskIds.length,
              Math.max(0, overIndex + (isBelow ? 1 : 0))
            ),
          };
        }
      }

      const columnTarget = findDropTarget(dropTargets, 'column');
      if (columnTarget?.data?.type === 'column') {
        const { columnId } = columnTarget.data;
        const taskIds = getTaskIdsByColumn(columnId);
        return { columnId, dropIndexRaw: taskIds.length };
      }

      return null;
    },
    [findDropTarget, getTaskIdsByColumn]
  );

  const updateGhost = useCallback(
    (sourceData: DragSourceData, dropTargets: DropTargetRecord[], pointer: { clientY?: number } | null) => {
      if (sourceData.type !== 'task') return;

      const resolved = resolveTaskDrop(dropTargets, pointer);
      if (!resolved) {
        if (lastGhostRef.current) {
          setGhostAt(null);
          lastGhostRef.current = null;
        }
        return;
      }

      const { columnId, dropIndexRaw } = resolved;
      const taskIds = getTaskIdsByColumn(columnId);
      const activeId = sourceData.taskId;

      let nextGhost: GhostAt | null = {
        activeId,
        columnId,
        index: dropIndexRaw,
      };

      const activeTask = tasksRef.current[activeId];
      if (activeTask && activeTask.columnId === columnId) {
        const activeIndex = taskIds.findIndex((id) => id === activeId);
        if (
          activeIndex >= 0 &&
          (dropIndexRaw === activeIndex || dropIndexRaw === activeIndex + 1)
        ) {
          nextGhost = null;
        }
      }

      const lastGhost = lastGhostRef.current;
      if (
        lastGhost &&
        nextGhost &&
        lastGhost.activeId === nextGhost.activeId &&
        lastGhost.columnId === nextGhost.columnId &&
        lastGhost.index === nextGhost.index
      ) {
        return;
      }

      lastGhostRef.current = nextGhost;
      setGhostAt(nextGhost);
    },
    [getTaskIdsByColumn, resolveTaskDrop]
  );

  const handleTaskDrop = useCallback(
    (sourceData: DragSourceData, dropTargets: DropTargetRecord[], pointer: { clientY?: number } | null) => {
      if (sourceData.type !== 'task') return;
      const resolved = resolveTaskDrop(dropTargets, pointer);
      if (!resolved) return;

      const { columnId, dropIndexRaw } = resolved;
      const activeId = sourceData.taskId;
      const activeTask = tasksRef.current[activeId];
      if (!activeTask) return;

      const taskIds = getTaskIdsByColumn(columnId);
      const sameColumn = activeTask.columnId === columnId;
      const activeIndex = sameColumn ? taskIds.findIndex((id) => id === activeId) : -1;

      if (sameColumn && (dropIndexRaw === activeIndex || dropIndexRaw === activeIndex + 1)) {
        return;
      }

      let targetTaskId: string | null = null;
      if (sameColumn) {
        targetTaskId =
          dropIndexRaw > activeIndex
            ? taskIds[dropIndexRaw - 1] ?? null
            : taskIds[dropIndexRaw] ?? null;
      } else {
        targetTaskId = taskIds[dropIndexRaw] ?? null;
      }

      moveTaskState(activeId, columnId, targetTaskId);
      const updatedTask = useTaskStore.getState().tasks[activeId];
      if (updatedTask && typeof updatedTask.order === 'number') {
        moveTaskTo(projectId, activeId, activeTask.columnId, columnId, updatedTask.order);
      }
    },
    [getTaskIdsByColumn, moveTaskState, moveTaskTo, projectId, resolveTaskDrop]
  );

  const handleColumnDrop = useCallback(
    (sourceData: DragSourceData, dropTargets: DropTargetRecord[], pointer: { clientX?: number } | null) => {
      if (sourceData.type !== 'column') return;
      const columnTarget = findDropTarget(dropTargets, 'column');
      if (!columnTarget?.data || columnTarget.data.type !== 'column') return;

      const sourceColumnId = sourceData.columnId;
      const targetColumnId = columnTarget.data.columnId;
      if (sourceColumnId === targetColumnId) return;

      const sourceColumn = columnsRef.current[sourceColumnId];
      const targetColumn = columnsRef.current[targetColumnId];
      if (!sourceColumn || !targetColumn) return;

      const rect = columnTarget.element?.getBoundingClientRect?.();
      const pointerX = pointer?.clientX;
      const isAfter =
        rect && typeof pointerX === 'number'
          ? pointerX > rect.left + rect.width / 2
          : false;

      const newOrder = isAfter
        ? targetColumn.order + (sourceColumn.order > targetColumn.order ? 1 : 0)
        : targetColumn.order - (sourceColumn.order < targetColumn.order ? 1 : 0);

      const clampedOrder = Math.max(0, newOrder);
      if (clampedOrder === sourceColumn.order) return;

      updateColumnOrder(sourceColumnId, { order: clampedOrder });
    },
    [findDropTarget, updateColumnOrder]
  );

  const resetDragState = useCallback(() => {
    setActiveTaskId(null);
    setGhostAt(null);
    lastGhostRef.current = null;
  }, []);

  useEffect(() => {
    if (!boardRef.current) return;

    return combine(
      monitorForElements({
        onDragStart({ source, location }) {
          const sourceData = source.data as DragSourceData;

          if (sourceData?.type === 'task') {
            setActiveTaskId(sourceData.taskId);
          } else if (sourceData?.type === 'column') {
            setActiveTaskId(null);
            setGhostAt(null);
            lastGhostRef.current = null;
          }

          if (location.current.input) {
            autoScroller.start({ input: location.current.input });
          }
        },
        onDrag({ source, location }) {
          const sourceData = source.data as DragSourceData;
          if (location.current.input) {
            autoScroller.updateInput({ input: location.current.input });
          }

          if (sourceData?.type === 'task') {
            const dropTargets = (location.current.dropTargets ?? []) as DropTargetRecord[];
            updateGhost(sourceData, dropTargets, location.current.input ?? null);
          }
        },
        onDrop({ source, location }) {
          const sourceData = source.data as DragSourceData;
          autoScroller.stop();

          if (sourceData?.type === 'task') {
            const dropTargets = (location.current.dropTargets ?? []) as DropTargetRecord[];
            handleTaskDrop(sourceData, dropTargets, location.current.input ?? null);
          } else if (sourceData?.type === 'column') {
            const dropTargets = (location.current.dropTargets ?? []) as DropTargetRecord[];
            handleColumnDrop(sourceData, dropTargets, location.current.input ?? null);
          }

          resetDragState();
        },
      }),
      autoScrollForElements({
        element: boardRef.current,
        canScroll: () => true,
        getConfiguration: () => ({
          maxScrollSpeed: 'standard',
        }),
      })
    );
  }, [handleColumnDrop, handleTaskDrop, resetDragState, updateGhost]);

  return (
    <div
      ref={boardRef}
      className="flex max-w-full h-full gap-4 items-start justify-start overflow-y-hidden overflow-x-auto scrollbar-thin-x"
    >
      {columnIds.map((id) => (
        <BoardColumn
          key={id}
          columnId={id}
          ghostAt={ghostAt?.columnId === id ? ghostAt : null}
          activeTaskId={activeTaskId}
        />
      ))}
    </div>
  );
};
