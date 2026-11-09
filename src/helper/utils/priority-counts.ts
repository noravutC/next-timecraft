import type { PriorityCounts, TaskCache } from '@/types';

/** What decides where a task is counted: its column, priority and whether it's archived. */
export type CountedTask = Pick<TaskCache, 'columnId' | 'priority' | 'archived'>;

/** A task before and after a change; null = didn't exist / doesn't any more. */
export type CountChange = [
  before: CountedTask | null | undefined,
  after: CountedTask | null | undefined,
];

const isCounted = (task: CountedTask | null | undefined): task is CountedTask =>
  Boolean(task && !task.archived);

const bump = (
  counts: Record<string, PriorityCounts>,
  task: CountedTask,
  by: number,
) => {
  const column = { ...(counts[task.columnId] ?? {}) };
  column[task.priority] = Math.max((column[task.priority] ?? 0) + by, 0);
  counts[task.columnId] = column;
};

/**
 * Per-column priority counts after some tasks were created, moved,
 * re-prioritised, archived or deleted. Archived tasks aren't counted.
 */
export function shiftPriorityCounts(
  counts: Record<string, PriorityCounts>,
  changes: CountChange[],
): Record<string, PriorityCounts> {
  const next = { ...counts };
  for (const [before, after] of changes) {
    const same =
      isCounted(before) &&
      isCounted(after) &&
      before.columnId === after.columnId &&
      before.priority === after.priority;
    if (same) continue;
    if (isCounted(before)) bump(next, before, -1);
    if (isCounted(after)) bump(next, after, +1);
  }
  return next;
}
