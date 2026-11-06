import type { TaskCache, TaskFilter } from '@/types';
import { dayKey, type DayKey } from '@/helper/utils/calendar-grid';

type Entry = Pick<
  TaskCache,
  'id' | 'columnId' | 'dueDate' | 'archived' | 'createdAt'
>;

/**
 * What the calendar shows: the fetched tasks, each replaced by the store's
 * copy when there is one (so edits and live updates show at once), split
 * into due days within the month and the "No due date" list.
 */
export function calendarEntries<T extends Entry>(args: {
  fetched: T[];
  live: Record<string, T | undefined>;
  columnIds: Set<string>;
  /** the month on screen, [from, to) */
  from: Date;
  to: Date;
  /** a column whose undated tasks stay out of the list (finished work) */
  hideUndatedIn: string | null;
}): { byDay: Map<DayKey, T[]>; undated: T[] } {
  const byDay = new Map<DayKey, T[]>();
  const undated: T[] = [];
  const seen = new Set<string>();
  for (const fetched of args.fetched) {
    if (seen.has(fetched.id)) continue;
    seen.add(fetched.id);
    const task = args.live[fetched.id] ?? fetched;
    if (task.archived || !args.columnIds.has(task.columnId)) continue;
    if (!task.dueDate) {
      if (task.columnId !== args.hideUndatedIn) undated.push(task);
      continue;
    }
    const due = new Date(task.dueDate);
    if (due < args.from || due >= args.to) continue;
    const key = dayKey(due);
    byDay.set(key, [...(byDay.get(key) ?? []), task]);
  }
  return { byDay, undated };
}

/**
 * The board filter as the calendar uses it: no search and no due date
 * buckets, since its toolbar has neither.
 */
export const calendarFilter = (
  filter: TaskFilter | undefined,
): TaskFilter | undefined => {
  if (!filter) return undefined;
  const { q: _q, due: _due, dueBounds: _bounds, ...rest } = filter;
  return Object.keys(rest).length ? rest : undefined;
};

/** A day before today, for tasks not in the finishing column: overdue. */
export const isOverdueOn = (
  day: Date,
  today: Date,
  columnId: string,
  finishColumnId: string | null,
): boolean => dayKey(day) < dayKey(today) && columnId !== finishColumnId;
