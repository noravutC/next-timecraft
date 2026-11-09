/** What deleting a column does to its tasks, for the confirm dialog. */
export const deleteColumnMessage = (taskCount: number): string =>
  taskCount === 0
    ? 'It has no tasks.'
    : `Its ${taskCount} ${taskCount === 1 ? 'task goes' : 'tasks go'} with it.`;

/** "Off", "3": a column's WIP limit in its menu. */
export const wipLimitLabel = (limit: number): string =>
  limit > 0 ? String(limit) : 'Off';
