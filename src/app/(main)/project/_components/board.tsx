'use client';

import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import invariant from 'tiny-invariant';
import { toast } from 'sonner';
import { SettingsContext } from '@/context/kanban/setting-provider';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import type { UpdateColumnPayload, UpdateTaskPayload } from '@/types';
import { useRealtimeBoard } from '@/hooks/sync-live-data/useRealtimeBoard';
import { computeCardMove, computeColumnMove } from './board-operations';
import { Column } from './column';
import {
  deriveBoardView,
  isCardData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  type PendingMove,
} from './data';

export const Board = () => {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const { settings } = useContext(SettingsContext);

  const projectId = useProjectStore((s) => s.projectIsUsing);
  const columns = useColumnStore(useShallow((s) => s.columns));
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const updateColumns = useColumnStore((s) => s.updateColumns);
  const tasks = useTaskStore(useShallow((s) => s.tasks));
  const updateTasks = useTaskStore((s) => s.updateTasks);
  useRealtimeBoard(projectId);

  // โหลดข้อมูล columns ลง store ครั้งแรก (tasks โหลดใน Column แต่ละตัวเอง)
  useEffect(() => {
    let active = true;
    if (!projectId) return;

    (async () => {
      try {
        await fetchColumns(projectId);
        if (!active) return;
      } catch {
        toast.error('Failed to load board data.');
      }
    })();

    return () => { active = false; };
  }, [fetchColumns, projectId]);

  const board = useMemo(
    () => deriveBoardView(columns, tasks, projectId, pendingMove),
    [columns, tasks, projectId, pendingMove],
  );

  // ref สำหรับ DnD callbacks เสมอใช้ข้อมูลล่าสุด
  const boardRef = useRef(board);
  boardRef.current = board;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // DnD monitors + autoscroll
  useEffect(() => {
    const element = scrollableRef.current;
    invariant(element);

    const scrollConfig = { maxScrollSpeed: settings.boardScrollSpeed };
    const canScroll = ({ source }: { source: { data: Record<string | symbol, unknown> } }) =>
      settings.isOverElementAutoScrollEnabled && (isDraggingACard({ source }) || isDraggingAColumn({ source }));

    return combine(
      monitorForElements({
        canMonitor: isDraggingACard,
        onDrop({ source, location }) {
          if (!isCardData(source.data)) return;
          const drop = location.current.dropTargets[0];
          if (!drop) return;

          const result = computeCardMove(boardRef.current.columns, source.data, drop.data);
          if (!result) return;

          // ดึงข้อมูล task ที่ถูก move มาสร้าง payload (จำเป็นต้องมีทุก field)
          const originalTask = tasksRef.current[result.taskId];
          if (!originalTask) return;

          setPendingMove({ type: 'card', ...result });
          void updateTasks(
            [result.taskId],
            [{ ...originalTask, id: result.taskId, columnId: result.toColumnId, orderFraction: result.newOrderFraction } as UpdateTaskPayload],
          )
            .then(() => setPendingMove(null))
            .catch(() => { toast.error('Failed to move task.'); setPendingMove(null); });
        },
      }),
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          if (!isColumnData(source.data)) return;
          const drop = location.current.dropTargets[0];
          if (!drop) return;

          const result = computeColumnMove(boardRef.current.columns, source.data, drop.data);
          if (!result) return;

          const col = boardRef.current.columns.find((c) => c.id === result.columnId);
          if (!col) return;

          setPendingMove({ type: 'column', ...result });
          void updateColumns(
            [result.columnId],
            [{ id: result.columnId, name: col.title, color: col.color ?? '#CBD5E1', wipLimit: col.wipLimit, orderFraction: result.newOrderFraction } as UpdateColumnPayload],
          )
            .then(() => setPendingMove(null))
            .catch(() => { toast.error('Failed to move column.'); setPendingMove(null); });
        },
      }),
      autoScrollForElements({ element, getConfiguration: () => scrollConfig, canScroll }),
      unsafeOverflowAutoScrollForElements({
        element,
        getConfiguration: () => scrollConfig,
        canScroll: ({ source }) => canScroll({ source }) && settings.isOverflowScrollingEnabled,
        getOverflow: () => ({
          fromLeftEdge: { top: 1000, left: 1000, bottom: 1000 },
          forRightEdge: { top: 1000, right: 1000, bottom: 1000 },
        }),
      }),
    );
  }, [settings, updateColumns, updateTasks]);

  const boardCls = settings.isBoardMoreObvious ? 'px-32 py-20' : '';
  const scrollCls = `flex h-full flex-row gap-3 overflow-x-auto p-3 [scrollbar-color:theme(colors.sky.600)_theme(colors.sky.800)] [scrollbar-width:thin] ${settings.isBoardMoreObvious ? 'rounded border-2 border-dashed' : ''}`;

  return (
    <div className={`flex h-full flex-col ${boardCls}`}>
      <div ref={scrollableRef} className={scrollCls}>
        {board.columns.map((column) => <Column key={column.id} column={column} />)}
      </div>
    </div>
  );
};
