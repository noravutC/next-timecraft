'use client';

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import { toast } from 'sonner';
import { SettingsContext } from '@/context/kanban/setting-provider';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import type { UpdateColumnPayload, UpdateTaskPayload } from '@/types';
import { moveCardWithFraction, moveColumnWithFraction } from './board-operations';
import { Column } from './column';
import {
  boardStateFromStoreData,
  boardViewFromState,
  createEmptyBoardState,
  isCardData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  type TBoardState,
} from './data';

const DEFAULT_TASK_LIMIT = 2000;
const EMPTY_BOARD_STATE = createEmptyBoardState();

export function Board() {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [boardState, setBoardState] = useState<TBoardState>(EMPTY_BOARD_STATE);
  const board = useMemo(() => boardViewFromState(boardState), [boardState]);
  const { settings } = useContext(SettingsContext);

  const projectId = useProjectStore((state) => state.projectIsUsing);
  const fetchColumns = useColumnStore((state) => state.fetchColumns);
  const updateColumns = useColumnStore((state) => state.updateColumns);
  const fetchTasksByColumns = useTaskStore((state) => state.fetchTasksByColumns);
  const updateTasks = useTaskStore((state) => state.updateTasks);

  // 1) Initial board load from stores
  useEffect(() => {
    let active = true;

    const loadBoardData = async () => {
      if (!projectId) {
        setBoardState(EMPTY_BOARD_STATE);
        return;
      }

      try {
        const columnsData = await fetchColumns(projectId);
        const columnIds = boardStateFromStoreData(columnsData, []).columnOrder;
        const tasksData =
          columnIds.length > 0
            ? await fetchTasksByColumns(columnIds, Math.max(DEFAULT_TASK_LIMIT, columnIds.length * 200))
            : [];
        if (active) {
          setBoardState(boardStateFromStoreData(columnsData, tasksData));
        }
      } catch (error) {
        console.error('Failed to load board data:', error);
        toast.error('Failed to load board data.');
      }
    };

    void loadBoardData();
    return () => {
      active = false;
    };
  }, [fetchColumns, fetchTasksByColumns, projectId]);

  // 2) Drag-and-drop orchestration (card + column + autoscroll)
  useEffect(() => {
    const element = scrollableRef.current;
    invariant(element);

    return combine(
      monitorForElements({
        canMonitor: isDraggingACard,
        onDrop({ source, location }) {
          if (!isCardData(source.data)) return;
          const innerMost = location.current.dropTargets[0];
          if (!innerMost) return;

          const previousBoard = boardState;
          const result = moveCardWithFraction(boardState, source.data, innerMost.data);
          if (!result) return;

          setBoardState(result.nextBoard);
          const payload = {
            ...result.movedCard,
            id: result.movedCard.id,
            columnId: result.toColumnId,
            orderFraction: result.movedCard.orderFraction,
          };

          void updateTasks([result.movedCard.id], [payload as UpdateTaskPayload]).catch((error) => {
            console.error('Failed to move task:', error);
            toast.error('Failed to move task.');
            setBoardState(previousBoard);
          });
        },
      }),
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          if (!isColumnData(source.data)) return;
          const innerMost = location.current.dropTargets[0];
          if (!innerMost) return;

          const previousBoard = boardState;
          const result = moveColumnWithFraction(boardState, source.data, innerMost.data);
          if (!result) return;

          setBoardState(result.nextBoard);
          const payload: UpdateColumnPayload = {
            id: result.movedColumn.id,
            name: result.movedColumn.title,
            color: result.movedColumn.color ?? '#CBD5E1',
            wipLimit: result.movedColumn.wipLimit,
            orderFraction: result.movedColumn.orderFraction,
          };

          void updateColumns([result.movedColumn.id], [payload]).catch((error) => {
            console.error('Failed to move column:', error);
            toast.error('Failed to move column.');
            setBoardState(previousBoard);
          });
        },
      }),
      autoScrollForElements({
        element,
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled) return false;
          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
      }),
      unsafeOverflowAutoScrollForElements({
        element,
        getConfiguration: () => ({ maxScrollSpeed: settings.boardScrollSpeed }),
        canScroll({ source }) {
          if (!settings.isOverElementAutoScrollEnabled || !settings.isOverflowScrollingEnabled) {
            return false;
          }
          return isDraggingACard({ source }) || isDraggingAColumn({ source });
        },
        getOverflow: () => ({
          fromLeftEdge: { top: 1000, left: 1000, bottom: 1000 },
          forRightEdge: { top: 1000, right: 1000, bottom: 1000 },
        }),
      }),
    );
  }, [boardState, settings, updateColumns, updateTasks]);

  // 3) Render
  return (
    <div className={`flex h-full flex-col ${settings.isBoardMoreObvious ? 'px-32 py-20' : ''}`}>
      <div
        ref={scrollableRef}
        className={`flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:theme(colors.sky.600)_theme(colors.sky.800)] [scrollbar-width:thin] ${settings.isBoardMoreObvious ? 'rounded border-2 border-dashed' : ''}`}
      >
        {board.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
