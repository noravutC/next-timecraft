import { create } from 'zustand';

type UnreadStore = {
  /** unread comments shown on board cards, by task id (missing = none) */
  byTask: Record<string, number>;
  /** counts from a board fetch; tasks it covered but left out have none */
  ingest: (counts: Record<string, number>, taskIds: string[]) => void;
  /** someone else commented (+1) or a comment went away (-1) */
  bump: (taskId: string, delta: number) => void;
  /** the user read the task's comments */
  clear: (taskId: string) => void;
};

export const useUnreadStore = create<UnreadStore>((set) => ({
  byTask: {},
  ingest: (counts, taskIds) =>
    set((s) => {
      const byTask = { ...s.byTask };
      for (const id of taskIds) byTask[id] = counts[id] ?? 0;
      return { byTask };
    }),
  bump: (taskId, delta) =>
    set((s) => ({
      byTask: {
        ...s.byTask,
        [taskId]: Math.max((s.byTask[taskId] ?? 0) + delta, 0),
      },
    })),
  clear: (taskId) =>
    set((s) =>
      s.byTask[taskId] ? { byTask: { ...s.byTask, [taskId]: 0 } } : s,
    ),
}));
