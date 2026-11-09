'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { MonthCell } from '@/helper/utils/calendar-grid';
import { useCalendarDayTarget } from './use-calendar-dnd';

/** One day: its number (Today marked), and its tasks, scrolling if many. */
export const CalendarDay = ({
  cell,
  isToday,
  lastInWeek,
  children,
}: {
  cell: MonthCell;
  isToday: boolean;
  lastInWeek: boolean;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const over = useCalendarDayTarget(ref, cell.date);
  return (
    <div
      ref={ref}
      className={cn(
        'flex min-h-0 flex-col gap-1 overflow-hidden border-b border-line-soft p-1.5',
        !lastInWeek && 'border-r',
        cell.inMonth ? 'bg-background' : 'bg-surface',
        over && 'bg-surface-hover ring-2 ring-brand/40 ring-inset',
      )}
    >
      <span className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            'grid size-6 place-items-center rounded-full text-xs font-medium',
            isToday
              ? 'bg-ink font-semibold text-white'
              : cell.inMonth
                ? 'text-ink'
                : 'text-ink-subtle',
          )}
        >
          {cell.day}
        </span>
        {isToday && <span className="text-xs font-medium text-ink">Today</span>}
      </span>
      <div className="flex min-h-0 flex-col gap-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
