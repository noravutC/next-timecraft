import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { unsafeOverflowAutoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/unsafe-overflow/element';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
  useCallback,
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
import { useSession } from 'next-auth/react';
import { resolveMine } from '@/helper/utils/task-filter';
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
import { offerUndo } from '@/components/undo/offer-undo';
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
  const boardName = useProjectStore((s) =>
    s.projectIsUsing ? (s.projects[s.projectIsUsing]?.name ?? null) : null,
  );
  // the board whose columns or tasks failed to load; shown in place
  const [failedBoard, setFailedBoard] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const loadFailed = failedBoard !== null && failedBoard === projectId;
  const retryLoad = useCallback(() => {
    setFailedBoard(null);
    setAttempt((n) => n + 1);
  }, []);
  const columns = useColumnStore(useShallow((s) => s.columns));
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const updateColumns = useColumnStore((s) => s.updateColumns);
  const tasks = useTaskStore(useShallow((s) => s.tasks));
  const taskPages = useTaskStore(useShallow((s) => s.taskPages));
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);
  useRealtimeBoard(projectId);

  const filterKey = useBoardFilterStore(selectFilterKey);
  const me = useSession().data?.user?.id ?? null;
  const filter = useMemo(
    () => resolveMine(useBoardFilterStore.getState().toFilterPayload(), me),
    // payload สร้างจาก filter state เท่านั้น — filterKey เปลี่ยนตามทุกค่า
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, me],
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
      } catch {
        if (active) setFailedBoard(projectId);
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchColumns, projectId, attempt]);

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
  const columnIdsKey = board.columns.map((c) => c.id).join(',');
  useEffect(() => {
    if (!columnIdsKey || !projectId) return;
    fetchTasksByColumns(columnIdsKey.split(','), TASK_PAGE_SIZE).catch(() =>
      setFailedBoard(projectId),
    );
  }, [columnIdsKey, filterKey, fetchTasksByColumns, projectId, attempt]);

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
          const placeAt = (columnId: string, orderFraction: string) =>
            updateTasks(
              [result.taskId],
              [
                {
                  ...originalTask,
                  id: result.taskId,
                  columnId,
                  orderFraction,
                } as UpdateTaskPayload,
              ],
            );
          void placeAt(result.toColumnId, result.newOrderFraction)
            .then(() => {
              setPendingMove(null);
              const nameOf = (id: string) =>
                boardRef.current.columns.find((c) => c.id === id)?.title ?? '';
              const from = originalTask.columnId;
              offerUndo({
                icon: 'move',
                title: 'Moved to',
                emphasis: nameOf(result.toColumnId),
                undo: () => placeAt(from, originalTask.orderFraction),
                undoneTitle: `Back in ${nameOf(from)}`,
                // reordering inside a column only joins the ⌘Z stack
                silent: from === result.toColumnId,
              });
            })
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

  return {
    scrollableRef,
    board,
    panCursor,
    settings,
    boardName,
    loadFailed,
    retryLoad,
  };
}
