/** What deleting a column does to its tasks, for the confirm dialog. */
export const deleteColumnMessage = (taskCount: number): string =>
  taskCount === 0
    ? 'It has no tasks. You can restore it from Board settings › Archive.'
    : `Its ${taskCount} ${taskCount === 1 ? 'task goes' : 'tasks go'} to the archive with it. You can restore both from Board settings › Archive.`;

/** "Off", "3": a column's WIP limit in its menu. */
export const wipLimitLabel = (limit: number): string =>
  limit > 0 ? String(limit) : 'Off';
