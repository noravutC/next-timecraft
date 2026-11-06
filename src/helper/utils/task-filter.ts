import type { PriorityCounts, TaskCache, TaskFilter } from '@/types';
import { dueBounds, dueBucketOf } from './due-filter';

export function isTaskFilterActive(
  filter: TaskFilter | null | undefined,
): boolean {
  if (!filter) return false;
  return Boolean(
    filter.q?.trim() ||
    filter.priorities?.length ||
    filter.tags?.length ||
    filter.assigneeIds?.length ||
    filter.mine ||
    filter.unassigned ||
    filter.due?.length,
  );
}

/** "Assigned to me" as a plain assignee, once it's known who "me" is. */
export function resolveMine(
  filter: TaskFilter | undefined,
  me: string | null | undefined,
): TaskFilter | undefined {
  if (!filter?.mine || !me) return filter;
  const { mine: _mine, ...rest } = filter;
  return { ...rest, assigneeIds: [...(rest.assigneeIds ?? []), me] };
}

/**
 * Client-side mirror of the server filter in POST /api/task/columns —
 * hides already-loaded tasks that don't match while filtered pages stream in.
 */
export function taskMatchesFilter(
  task: Pick<TaskCache, 'title' | 'priority' | 'tags' | 'dueDate'>,
  filter: TaskFilter | null | undefined,
  taskAssigneeIds: string[] = [],
): boolean {
  if (!filter || !isTaskFilterActive(filter)) return true;

  const q = filter.q?.trim().toLowerCase();
  if (q && !task.title.toLowerCase().includes(q)) return false;

  if (filter.priorities?.length && !filter.priorities.includes(task.priority)) {
    return false;
  }

  if (
    filter.tags?.length &&
    !filter.tags.some((tag) => (task.tags ?? []).includes(tag))
  ) {
    return false;
  }

  if (
    filter.due?.length &&
    !filter.due.includes(
      dueBucketOf(task.dueDate, filter.dueBounds ?? dueBounds()),
    )
  ) {
    return false;
  }

  // the assignee choices widen each other: any of these people, or nobody
  if (filter.assigneeIds?.length || filter.unassigned) {
    const anyOf = filter.assigneeIds?.some((id) =>
      taskAssigneeIds.includes(id),
    );
    const nobody = filter.unassigned && taskAssigneeIds.length === 0;
    if (!anyOf && !nobody) return false;
  }

  return true;
}

/** Board-wide tasks per priority: sums each column's counts. */
export function sumPriorityCounts(
  byColumn: Record<string, PriorityCounts>,
  columnIds: string[],
): PriorityCounts {
  const total: PriorityCounts = {};
  for (const id of columnIds) {
    for (const [priority, n] of Object.entries(byColumn[id] ?? {})) {
      const key = priority as keyof PriorityCounts;
      total[key] = (total[key] ?? 0) + (n ?? 0);
    }
  }
  return total;
}
