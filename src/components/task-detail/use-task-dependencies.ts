'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { taskServices } from '@/services/tasks.service';
import { useDependencyStore } from '@/store/use-dependency.store';
import type { DependencyTask } from '@/types';

/** A linked task, with where it sits when the column isn't known yet. */
export type LinkedTask = DependencyTask & {
  columnName?: string;
  columnColor?: string;
};

type Links = { blockedBy: LinkedTask[]; blocking: LinkedTask[] };

/** The open task's blockers and what it blocks; blockers can be changed. */
export function useTaskDependencies(taskId: string) {
  const [links, setLinks] = useState<Links | null>(null);

  const load = useCallback(
    () =>
      taskServices
        .getDependencies(taskId)
        .then(setLinks)
        .catch(() => setLinks({ blockedBy: [], blocking: [] })),
    [taskId],
  );
  useEffect(() => {
    void load();
  }, [load]);

  /** shows the change at once, then the server's answer */
  const toggle = async (task: LinkedTask, on: boolean) => {
    const before = links;
    setLinks(
      (l) =>
        l && {
          ...l,
          blockedBy: on
            ? [...l.blockedBy, task]
            : l.blockedBy.filter((t) => t.id !== task.id),
        },
    );
    try {
      const blockers = await taskServices.setBlocker(taskId, task.id, on);
      useDependencyStore.getState().setBlockers(taskId, blockers);
      await load();
    } catch (error) {
      setLinks(before);
      toast.error(
        (error as { message?: string })?.message ??
          'Couldn’t change the blockers',
      );
    }
  };

  return { links, toggle };
}
