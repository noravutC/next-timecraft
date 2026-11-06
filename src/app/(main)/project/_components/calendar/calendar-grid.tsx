'use client';

import { cn } from '@/lib/utils';
import {
  dayKey,
  type DayKey,
  type MonthCell,
} from '@/helper/utils/calendar-grid';
import type { TaskCache } from '@/types';
import { CalendarChip } from './calendar-chip';
import { CalendarDay } from './calendar-day';
import { isOverdueOn } from './calendar-operations';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// whole weeks: 4, 5 or 6 rows under the weekday names
const ROWS: Record<number, string> = {
  4: 'grid-rows-[2rem_repeat(4,minmax(0,1fr))]',
  5: 'grid-rows-[2rem_repeat(5,minmax(0,1fr))]',
  6: 'grid-rows-[2rem_repeat(6,minmax(0,1fr))]',
};

/** The month, Sunday first, with each day's tasks. */
export const CalendarGrid = ({
  cells,
  byDay,
  columnColor,
  finishColumnId,
  canMove,
  onOpen,
}: {
  cells: MonthCell[];
  byDay: Map<DayKey, TaskCache[]>;
  columnColor: (columnId: string) => string;
  finishColumnId: string | null;
  canMove: boolean;
  onOpen: (taskId: string) => void;
}) => {
  const today = new Date();
  const todayKey = dayKey(today);
  return (
    <div
      className={cn(
        'grid min-h-0 min-w-0 flex-1 grid-cols-7',
        ROWS[cells.length / 7],
      )}
    >
      {WEEKDAYS.map((label, i) => (
        <div
          key={label}
          aria-hidden
          className={cn(
            'flex items-center border-b border-line px-2.5 text-xs font-medium text-ink-subtle',
            i < 6 && 'border-r border-r-line-soft',
          )}
        >
          {label}
        </div>
      ))}
      {cells.map((cell, i) => (
        <CalendarDay
          key={cell.key}
          cell={cell}
          isToday={cell.key === todayKey}
          lastInWeek={i % 7 === 6}
        >
          {(byDay.get(cell.key) ?? []).map((task) => (
            <CalendarChip
              key={task.id}
              task={task}
              dotColor={columnColor(task.columnId)}
              overdue={isOverdueOn(
                cell.date,
                today,
                task.columnId,
                finishColumnId,
              )}
              draggable={canMove}
              onOpen={() => onOpen(task.id)}
            />
          ))}
        </CalendarDay>
      ))}
    </div>
  );
};
