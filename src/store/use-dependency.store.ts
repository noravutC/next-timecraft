import { create } from 'zustand';
import type { BlockerRef } from '@/types';

// blockers per loaded task, for the Blocked tag; whether one is finished
// is worked out against the live task store (see helper/utils/task-blocked)
type DependencyStore = {
  blockersByTask: Record<string, BlockerRef[]>;
  /** a fetched page: its tasks have exactly these blockers */
  ingestPage: (
    taskIds: string[],
    blockers: Record<string, BlockerRef[]>,
  ) => void;
  setBlockers: (taskId: string, blockers: BlockerRef[]) => void;
};

export const useDependencyStore = create<DependencyStore>((set) => ({
  blockersByTask: {},
  ingestPage: (taskIds, blockers) =>
    set((s) => {
      const next = { ...s.blockersByTask };
      for (const id of taskIds) {
        if (blockers[id]?.length) next[id] = blockers[id];
        else delete next[id];
      }
      return { blockersByTask: next };
    }),
  setBlockers: (taskId, blockers) =>
    set((s) => {
      const next = { ...s.blockersByTask };
      if (blockers.length) next[taskId] = blockers;
      else delete next[taskId];
      return { blockersByTask: next };
    }),
}));
