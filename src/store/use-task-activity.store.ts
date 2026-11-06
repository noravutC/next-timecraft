import { create } from 'zustand';
import { taskActivityServices } from '@/services/task-activity.service';
import type { TaskActivityWithActor } from '@/types';
import type { LoaderStatus } from '@/types/global/types';

type TaskActivityState = {
  items: TaskActivityWithActor[];
  nextCursor: string | null;
  status: LoaderStatus;
};

const empty: TaskActivityState = {
  items: [],
  nextCursor: null,
  status: 'none',
};

type TaskActivityStore = {
  byTask: Record<string, TaskActivityState>;
  /** (re)load the newest page, replacing what's cached */
  fetch: (taskId: string) => Promise<void>;
  /** append the next older page */
  fetchMore: (taskId: string) => Promise<void>;
};

export const useTaskActivityStore = create<TaskActivityStore>((set, get) => {
  const patch = (taskId: string, next: Partial<TaskActivityState>) =>
    set((s) => ({
      byTask: {
        ...s.byTask,
        [taskId]: { ...(s.byTask[taskId] ?? empty), ...next },
      },
    }));

  return {
    byTask: {},
    fetch: async (taskId) => {
      patch(taskId, { status: 'fetching' });
      try {
        const res = await taskActivityServices.list(taskId);
        patch(taskId, {
          items: res.data?.items ?? [],
          nextCursor: res.data?.nextCursor ?? null,
          status: 'none',
        });
      } catch (error) {
        patch(taskId, { status: 'error' });
        throw error;
      }
    },
    fetchMore: async (taskId) => {
      const current = get().byTask[taskId];
      if (!current?.nextCursor || current.status === 'fetching') return;
      patch(taskId, { status: 'fetching' });
      try {
        const res = await taskActivityServices.list(taskId, current.nextCursor);
        const seen = new Set(current.items.map((i) => i.id));
        patch(taskId, {
          items: [
            ...current.items,
            ...(res.data?.items ?? []).filter((i) => !seen.has(i.id)),
          ],
          nextCursor: res.data?.nextCursor ?? null,
          status: 'none',
        });
      } catch (error) {
        patch(taskId, { status: 'error' });
        throw error;
      }
    },
  };
});
