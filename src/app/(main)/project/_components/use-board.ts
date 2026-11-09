import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import invariant from 'tiny-invariant';
import { toast } from 'sonner';
import { SettingsContext } from '@/context/kanban/setting-provider';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';
import { TASK_PAGE_SIZE, useTaskStore } from '@/store/use-task.store';
import type { UpdateTaskPayload } from '@/types';
import { useRealtimeBoard } from '@/store/sync-live-data/useRealtimeBoard';
import { useAssigneeStore } from '@/store/use-assignee.store';
import {
  selectFilterKey,
  useBoardFilterStore,
} from '@/store/use-board-filter.store';
import { computeCardMove, computeColumnMove } from './board-operations';
import { useSpacebarPan } from './use-spacebar-pan';
import {
  deriveBoardView,
  isCardData,
  isColumnData,
  isDraggingACard,
  isDraggingAColumn,
  type PendingMove,
} from './data';

/**
 * State + wiring ทั้งหมดของหน้าบอร์ด: โหลด columns, realtime, filter payload,
 * derive board view, DnD monitors (card/column move + optimistic pending),
 * auto-scroll และ spacebar pan — หน้า page เอาไป render อย่างเดียว
 */
export function useBoard() {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const { settings } = useContext(SettingsContext);

  const projectId = useProjectStore((s) => s.projectIsUsing);
  const columns = useColumnStore(useShallow((s) => s.columns));
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const updateColumns = useColumnStore((s) => s.updateColumns);
  const tasks = useTaskStore(useShallow((s) => s.tasks));
  const taskPages = useTaskStore(useShallow((s) => s.taskPages));
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);
  useRealtimeBoard(projectId);

  const filterQ = useBoardFilterStore((s) => s.q);
  const filterPriorities = useBoardFilterStore((s) => s.priorities);
  const filterTags = useBoardFilterStore((s) => s.tags);
  const filterAssignees = useBoardFilterStore((s) => s.assigneeIds);
  const filter = useMemo(
    () => useBoardFilterStore.getState().toFilterPayload(),
    // payload สร้างจาก state พวกนี้เท่านั้น — deps ครบแล้วแม้ lint มองไม่เห็น
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterQ, filterPriorities, filterTags, filterAssignees],
  );

  const assigneesByTask = useAssigneeStore(useShallow((s) => s.byTask));
  const assigneeIdsByTask = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [taskId, state] of Object.entries(assigneesByTask)) {
      map[taskId] = state.items.map((item) => item.userId);
    }
    return map;
  }, [assigneesByTask]);

  // โหลดข้อมูล columns ลง store ครั้งแรก (tasks โหลดรวมทั้งบอร์ดด้านล่าง)
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

    return () => {
      active = false;
    };
  }, [fetchColumns, projectId]);

  const board = useMemo(
    () =>
      deriveBoardView(
        columns,
        tasks,
        projectId,
        pendingMove,
        taskPages,
        filter,
        assigneeIdsByTask,
      ),
    [
      columns,
      tasks,
      projectId,
      pendingMove,
      taskPages,
      filter,
      assigneeIdsByTask,
    ],
  );

  // task หน้าแรกของทุก column ในคำขอเดียว — โหลดใหม่เมื่อชุด column หรือ
  // filter เปลี่ยน (เดิมยิงแยกทีละ column)
  const filterKey = useBoardFilterStore(selectFilterKey);
  const columnIdsKey = board.columns.map((c) => c.id).join(',');
  useEffect(() => {
    if (!columnIdsKey) return;
    fetchTasksByColumns(columnIdsKey.split(','), TASK_PAGE_SIZE).catch(
      () => {},
    );
  }, [columnIdsKey, filterKey, fetchTasksByColumns]);

  // ref สำหรับ DnD callbacks เสมอใช้ข้อมูลล่าสุด (อัปเดตหลัง commit ไม่ใช่ระหว่าง render)
  const boardRef = useRef(board);
  const tasksRef = useRef(tasks);
  useLayoutEffect(() => {
    boardRef.current = board;
    tasksRef.current = tasks;
  });

  // DnD monitors + autoscroll
  useEffect(() => {
    const element = scrollableRef.current;
    invariant(element);

    const scrollConfig = { maxScrollSpeed: settings.boardScrollSpeed };
    const canScroll = ({
      source,
    }: {
      source: { data: Record<string | symbol, unknown> };
    }) =>
      settings.isOverElementAutoScrollEnabled &&
      (isDraggingACard({ source }) || isDraggingAColumn({ source }));

    return combine(
      monitorForElements({
        canMonitor: isDraggingACard,
        onDrop({ source, location }) {
          if (!isCardData(source.data)) return;
          const drop = location.current.dropTargets[0];
          if (!drop) return;

          const result = computeCardMove(
            boardRef.current.columns,
            source.data,
            drop.data,
          );
          if (!result) return;

          // ดึงข้อมูล task ที่ถูก move มาสร้าง payload (จำเป็นต้องมีทุก field)
          const originalTask = tasksRef.current[result.taskId];
          if (!originalTask) return;

          setPendingMove({ type: 'card', ...result });
          void updateTasks(
            [result.taskId],
            [
              {
                ...originalTask,
                id: result.taskId,
                columnId: result.toColumnId,
                orderFraction: result.newOrderFraction,
              } as UpdateTaskPayload,
            ],
          )
            .then(() => setPendingMove(null))
            .catch(() => {
              toast.error('Failed to move task.');
              setPendingMove(null);
            });
        },
      }),
      monitorForElements({
        canMonitor: isDraggingAColumn,
        onDrop({ source, location }) {
          if (!isColumnData(source.data)) return;
          const drop = location.current.dropTargets[0];
          if (!drop) return;

          const result = computeColumnMove(
            boardRef.current.columns,
            source.data,
            drop.data,
          );
          if (!result) return;

          setPendingMove({ type: 'column', ...result });
          // a move only changes the order: re-sending name/color would fail
          // validation for long legacy names and reset an unset color
          void updateColumns(
            [result.columnId],
            [
              {
                id: result.columnId,
                orderFraction: result.newOrderFraction,
              },
            ],
          )
            .then(() => setPendingMove(null))
            .catch(() => {
              toast.error('Failed to move column.');
              setPendingMove(null);
            });
        },
      }),
      autoScrollForElements({
        element,
        getConfiguration: () => scrollConfig,
        canScroll,
      }),
      unsafeOverflowAutoScrollForElements({
        element,
        getConfiguration: () => scrollConfig,
        canScroll: ({ source }) =>
          canScroll({ source }) && settings.isOverflowScrollingEnabled,
        getOverflow: () => ({
          fromLeftEdge: { top: 1000, left: 1000, bottom: 1000 },
          forRightEdge: { top: 1000, right: 1000, bottom: 1000 },
        }),
      }),
    );
  }, [settings, updateColumns, updateTasks]);

  const panCursor = useSpacebarPan(scrollableRef);

  return { scrollableRef, board, panCursor, settings };
}
