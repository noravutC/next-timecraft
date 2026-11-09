import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTaskActivityStore } from '@/store/use-task-activity.store';
import { useTaskStore } from '@/store/use-task.store';
import {
  describeActivity,
  groupActivityByDay,
} from '@/helper/utils/task-activity-view';

/**
 * The Activity tab's data: loads the task's history, reloads whenever the
 * task changes (a change adds a row), and groups it by day in the order the
 * user picked.
 */
export function useTaskActivityList(taskId: string) {
  const state = useTaskActivityStore(useShallow((s) => s.byTask[taskId]));
  const fetch = useTaskActivityStore((s) => s.fetch);
  const fetchMore = useTaskActivityStore((s) => s.fetchMore);
  const updatedAt = useTaskStore((s) => s.tasks[taskId]?.updatedAt);
  const [newestFirst, setNewestFirst] = useState(true);

  useEffect(() => {
    fetch(taskId).catch(() => {});
  }, [taskId, updatedAt, fetch]);

  const items = state?.items;
  const days = useMemo(() => {
    const list = items ?? [];
    const ordered = newestFirst ? list : [...list].reverse();
    return groupActivityByDay(ordered).map((day) => ({
      ...day,
      rows: day.items.map((item) => ({
        id: item.id,
        actorName: item.actor?.fullName ?? null,
        time: item.time,
        line: describeActivity(item),
      })),
    }));
  }, [items, newestFirst]);

  return {
    days,
    loading: !state || (state.status === 'fetching' && !state.items.length),
    failed: state?.status === 'error' && !state.items.length,
    empty: state?.status === 'none' && state.items.length === 0,
    hasMore: Boolean(state?.nextCursor),
    loadingMore: state?.status === 'fetching' && Boolean(state.items.length),
    loadMore: () => fetchMore(taskId).catch(() => {}),
    retry: () => fetch(taskId).catch(() => {}),
    newestFirst,
    toggleOrder: () => setNewestFirst((v) => !v),
  };
}
