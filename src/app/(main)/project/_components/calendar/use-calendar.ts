'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  projectServices,
  type CalendarData,
} from '@/services/projects.service';
import {
  selectFilterKey,
  useBoardFilterStore,
} from '@/store/use-board-filter.store';
import { useTaskStore } from '@/store/use-task.store';
import { useDependencyStore } from '@/store/use-dependency.store';
import { dayKey, monthGrid, shiftMonth } from '@/helper/utils/calendar-grid';
import { formatMonthDay } from '@/helper/utils/date-format';
import { offerUndo } from '@/components/undo/offer-undo';
import type { ColumnCache, TaskCache } from '@/types';
import { calendarEntries, calendarFilter } from './calendar-operations';

const thisMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

/**
 * The calendar's month, its tasks (fetched for the month, then kept in
 * step with the task store) and moving a task to a day.
 */
export function useCalendar(projectId: string | null, columns: ColumnCache[]) {
  const [month, setMonth] = useState(thisMonth);
  const [showFinished, setShowFinished] = useState(false);
  const [data, setData] = useState<CalendarData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const filterKey = useBoardFilterStore(selectFilterKey);
  const live = useTaskStore(useShallow((s) => s.tasks));

  const cells = useMemo(() => monthGrid(month.year, month.month), [month]);
  const from = cells[0].date;
  const to = useMemo(() => {
    const last = cells[cells.length - 1].date;
    return new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  }, [cells]);
  const finishColumn = columns.find((c) => c.isDone) ?? null;
  const hideUndatedIn = showFinished ? null : (finishColumn?.id ?? null);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    projectServices
      .getCalendar(projectId, {
        from: from.toISOString(),
        to: to.toISOString(),
        filter: calendarFilter(
          useBoardFilterStore.getState().toFilterPayload(),
        ),
        hideUndatedIn: hideUndatedIn ?? undefined,
      })
      .then((next) => {
        if (!active) return;
        setData(next);
        setFailed(false);
        useDependencyStore.getState().ingestPage(
          [...next.dated, ...next.undated].map((t) => t.id),
          next.blockers ?? {},
        );
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
    // filterKey stands for the filter the payload is built from
  }, [projectId, from, to, filterKey, hideUndatedIn, attempt]);

  const { byDay, undated } = useMemo(
    () =>
      calendarEntries<TaskCache>({
        fetched: [...(data?.dated ?? []), ...(data?.undated ?? [])],
        live,
        columnIds: new Set(columns.map((c) => c.id)),
        from,
        to,
        hideUndatedIn,
      }),
    [data, live, columns, from, to, hideUndatedIn],
  );

  const moveToDay = useCallback((task: TaskCache, day: Date) => {
    const store = useTaskStore.getState();
    // a task the board hasn't loaded yet goes in first, so the update has
    // the whole task to change
    if (!store.tasks[task.id]) store.upsertOpenedTask(task);
    const current = useTaskStore.getState().tasks[task.id] ?? task;
    const before = current.dueDate ? new Date(current.dueDate) : null;
    if (before && dayKey(before) === dayKey(day)) return;
    const setDue = (dueDate: Date | null) =>
      useTaskStore.getState().updateTasks(
        [task.id],
        [
          {
            id: task.id,
            columnId: current.columnId,
            title: current.title,
            dueDate,
          },
        ],
      );
    void setDue(day);
    offerUndo({
      icon: 'move',
      title: 'Due',
      emphasis: formatMonthDay(day),
      undo: () => setDue(before),
      undoneTitle: before
        ? `Due ${formatMonthDay(before)} again`
        : 'No due date again',
    });
  }, []);

  return {
    month,
    cells,
    byDay,
    undated,
    /** undated tasks beyond the first page aren't listed */
    undatedTotal: data
      ? data.undatedTotal - data.undated.length + undated.length
      : 0,
    loading: !data && !failed,
    failed,
    finishColumn,
    showFinished,
    setShowFinished,
    retry: () => {
      setFailed(false);
      setAttempt((n) => n + 1);
    },
    goToday: () => setMonth(thisMonth()),
    goBy: (by: number) => setMonth((m) => shiftMonth(m, by)),
    moveToDay,
  };
}
