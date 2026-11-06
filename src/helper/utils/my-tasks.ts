import type { MyTask } from '@/types';
import { formatMonthDay } from './date-format';
import { dueBounds } from './due-filter';

export type DueGroup = 'overdue' | 'this_week' | 'next_week' | 'later' | 'none';

export const DUE_GROUP_LABELS: Record<DueGroup, string> = {
  overdue: 'Overdue',
  this_week: 'This week',
  next_week: 'Next week',
  later: 'Later',
  none: 'No due date',
};

const ORDER: DueGroup[] = [
  'overdue',
  'this_week',
  'next_week',
  'later',
  'none',
];

/** Before today, to Sunday, the week after, beyond, or no date at all. */
export const dueGroupOf = (
  dueDate: Date | string | null,
  now: Date = new Date(),
): DueGroup => {
  if (!dueDate) return 'none';
  const { today, weekEnd } = dueBounds(now);
  const due = new Date(dueDate).getTime();
  const end = new Date(weekEnd);
  const nextEnd = new Date(end);
  nextEnd.setDate(end.getDate() + 7);
  if (due < new Date(today).getTime()) return 'overdue';
  if (due < end.getTime()) return 'this_week';
  if (due < nextEnd.getTime()) return 'next_week';
  return 'later';
};

const midnight = (at: Date) =>
  new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();

/** Today, Tomorrow, "Nov 4"; next week names the weekday: "Mon, Nov 9". */
export const myTaskDueLabel = (
  dueDate: Date,
  now: Date = new Date(),
): string => {
  const days = Math.round((midnight(dueDate) - midnight(now)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return dueGroupOf(dueDate, now) === 'next_week'
    ? dueDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : formatMonthDay(dueDate, now);
};

const byDue = (a: MyTask, b: MyTask) =>
  (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
  (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);

/** Tasks in due-date groups, soonest first, empty groups left out. */
export const groupByDue = (
  tasks: MyTask[],
  now: Date = new Date(),
): { key: DueGroup; tasks: MyTask[] }[] => {
  const groups = new Map<DueGroup, MyTask[]>();
  for (const task of [...tasks].sort(byDue)) {
    const key = dueGroupOf(task.dueDate, now);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return ORDER.filter((key) => groups.has(key)).map((key) => ({
    key,
    tasks: groups.get(key)!,
  }));
};

/** Tasks per board, boards in the order given, soonest due first. */
export const groupByBoard = (
  tasks: MyTask[],
  boardOrder: string[],
): { key: string; tasks: MyTask[] }[] => {
  const groups = new Map<string, MyTask[]>();
  for (const task of [...tasks].sort(byDue)) {
    groups.set(task.projectId, [...(groups.get(task.projectId) ?? []), task]);
  }
  const rank = (id: string) => {
    const i = boardOrder.indexOf(id);
    return i === -1 ? boardOrder.length : i;
  };
  return [...groups.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map((key) => ({ key, tasks: groups.get(key)! }));
};

export type MyTaskGroup = {
  key: string;
  label: string;
  /** Overdue reads in red */
  danger: boolean;
  tasks: MyTask[];
};

/** Everything the page shows: the counts and the groups. */
export const myTasksView = (
  tasks: MyTask[],
  options: {
    grouping: 'due' | 'board';
    showDone: boolean;
    boards: Record<string, { name: string }>;
    now?: Date;
  },
) => {
  const open = tasks.filter((t) => !t.finished);
  const shown = options.showDone ? tasks : open;
  const groups: MyTaskGroup[] =
    options.grouping === 'due'
      ? groupByDue(shown, options.now).map((g) => ({
          key: g.key,
          label: DUE_GROUP_LABELS[g.key],
          danger: g.key === 'overdue',
          tasks: g.tasks,
        }))
      : groupByBoard(shown, Object.keys(options.boards)).map((g) => ({
          key: g.key,
          label: options.boards[g.key]?.name ?? 'A board',
          danger: false,
          tasks: g.tasks,
        }));
  return {
    groups,
    openCount: open.length,
    doneCount: tasks.length - open.length,
    boardCount: new Set(open.map((t) => t.projectId)).size,
    shownCount: shown.length,
  };
};
