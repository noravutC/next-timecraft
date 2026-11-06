import type { SubtaskProgress } from '@/types';

/** done/total from a loaded subtask list; null when the task has none. */
export const progressFromItems = (
  items: { completed: boolean }[],
): SubtaskProgress | null =>
  items.length === 0
    ? null
    : { done: items.filter((i) => i.completed).length, total: items.length };

/** 0-100, for the progress bar. */
export const progressPercent = (progress: SubtaskProgress | null): number =>
  progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;
