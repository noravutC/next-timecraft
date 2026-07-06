import type { TaskCache, TaskFilter } from '@/types';

export function isTaskFilterActive(
  filter: TaskFilter | null | undefined,
): boolean {
  if (!filter) return false;
  return Boolean(
    filter.q?.trim() ||
    filter.priorities?.length ||
    filter.tags?.length ||
    filter.assigneeIds?.length,
  );
}

/**
 * Client-side mirror of the server filter in POST /api/task/columns —
 * hides already-loaded tasks that don't match while filtered pages stream in.
 */
export function taskMatchesFilter(
  task: Pick<TaskCache, 'title' | 'priority' | 'tags'>,
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
    filter.assigneeIds?.length &&
    !filter.assigneeIds.some((id) => taskAssigneeIds.includes(id))
  ) {
    return false;
  }

  return true;
}
