/** A local calendar day as YYYY-MM-DD, the key the calendar groups by. */
export type DayKey = string;

export type MonthCell = {
  key: DayKey;
  /** local midnight; dropping a task here gives it this due date */
  date: Date;
  day: number;
  inMonth: boolean;
};

const pad = (n: number) => String(n).padStart(2, '0');

export const dayKey = (at: Date): DayKey =>
  `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;

/** Whole Sunday-first weeks covering the month (`month` is 0-11). */
export const monthGrid = (year: number, month: number): MonthCell[] => {
  const first = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const count = Math.ceil((first + daysIn) / 7) * 7;
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, month, 1 - first + i);
    return {
      key: dayKey(date),
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
};

/** The month `by` months away, as { year, month (0-11) }. */
export const shiftMonth = (
  at: { year: number; month: number },
  by: number,
): { year: number; month: number } => {
  const moved = new Date(at.year, at.month + by, 1);
  return { year: moved.getFullYear(), month: moved.getMonth() };
};

export const monthLabel = (year: number, month: number): string =>
  new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

/** Tasks grouped by the local day they're due; undated ones are left out. */
export const tasksByDay = <T extends { dueDate: Date | string | null }>(
  tasks: T[],
): Map<DayKey, T[]> => {
  const days = new Map<DayKey, T[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = dayKey(new Date(task.dueDate));
    days.set(key, [...(days.get(key) ?? []), task]);
  }
  return days;
};

/** Today and the days before it, newest first, for picking a recent day. */
export const recentDays = (
  count: number,
  now: Date = new Date(),
): { key: DayKey; label: string }[] =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Yesterday'
          : date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
    return { key: dayKey(date), label };
  });
