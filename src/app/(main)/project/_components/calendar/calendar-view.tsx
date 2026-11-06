'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useBoardAccess } from '@/components/project/use-board-access';
import { useOpenTask } from '@/components/task-detail/use-open-task';
import { useColumnStore } from '@/store/use-column.store';
import { useProjectStore } from '@/store/use-project.store';
import { useRealtimeBoard } from '@/store/sync-live-data/useRealtimeBoard';
import { monthLabel } from '@/helper/utils/calendar-grid';
import { byOrderFraction } from '@/helper/utils/subtask-order';
import { ArchivedBoardBanner } from '../archived-board-banner';
import { BoardLoadError } from '../board-load-error';
import { CalendarGrid } from './calendar-grid';
import { CalendarToolbar } from './calendar-toolbar';
import { UndatedPanel } from './undated-panel';
import { useCalendar } from './use-calendar';
import { useCalendarDrop } from './use-calendar-dnd';

const NO_COLOR = 'var(--ink-faint)';

/** The board as a month of due dates, with the undated tasks beside it. */
export function CalendarView() {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const boardName = useProjectStore((s) =>
    s.projectIsUsing ? (s.projects[s.projectIsUsing]?.name ?? '') : '',
  );
  const allColumns = useColumnStore(useShallow((s) => s.columns));
  const fetchColumns = useColumnStore((s) => s.fetchColumns);
  const columns = useMemo(
    () =>
      byOrderFraction(
        Object.values(allColumns).filter((c) => c.projectId === projectId),
      ),
    [allColumns, projectId],
  );
  useRealtimeBoard(projectId);
  // a calendar link can be the first page opened: load the columns too
  useEffect(() => {
    if (projectId) fetchColumns(projectId).catch(() => {});
  }, [projectId, fetchColumns]);

  const calendar = useCalendar(projectId, columns);
  useCalendarDrop(calendar.moveToDay);
  const openTask = useOpenTask();
  const canMove = useBoardAccess().can('task:update');
  const column = useCallback(
    (id: string) => ({
      name: allColumns[id]?.name ?? '',
      color: allColumns[id]?.color ?? NO_COLOR,
    }),
    [allColumns],
  );
  const open = (taskId: string) => void openTask(taskId);

  return (
    <div className="relative flex h-full flex-col bg-background">
      <CalendarToolbar
        projectId={projectId}
        boardName={boardName}
        columnIds={columns.map((c) => c.id)}
        monthLabel={monthLabel(calendar.month.year, calendar.month.month)}
        onToday={calendar.goToday}
        onMove={calendar.goBy}
      />
      <ArchivedBoardBanner />
      {calendar.failed ? (
        <div className="px-5">
          <BoardLoadError name={boardName} onRetry={calendar.retry} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <CalendarGrid
            cells={calendar.cells}
            byDay={calendar.byDay}
            columnColor={(id) => column(id).color}
            finishColumnId={calendar.finishColumn?.id ?? null}
            canMove={canMove}
            onOpen={open}
          />
          <UndatedPanel
            tasks={calendar.undated}
            total={calendar.undatedTotal}
            column={column}
            finishColumnName={calendar.finishColumn?.name ?? null}
            showFinished={calendar.showFinished}
            onShowFinished={calendar.setShowFinished}
            canMove={canMove}
            onOpen={open}
          />
        </div>
      )}
    </div>
  );
}
