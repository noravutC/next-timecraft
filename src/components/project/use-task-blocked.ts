'use client';

import { useShallow } from 'zustand/react/shallow';
import { useColumnStore } from '@/store/use-column.store';
import { useDependencyStore } from '@/store/use-dependency.store';
import { useProjectStore } from '@/store/use-project.store';
import { useTaskStore } from '@/store/use-task.store';
import { finishColumnOf, isBlocked } from '@/helper/utils/task-blocked';

const NONE = {};

/** True while any of the task's blockers is still open. */
export function useTaskBlocked(taskId: string): boolean {
  const projectId = useProjectStore((s) => s.projectIsUsing);
  const blockers = useDependencyStore((s) => s.blockersByTask[taskId]);
  const finish = useColumnStore((s) =>
    finishColumnOf(Object.values(s.columns), projectId),
  );
  const live = useTaskStore(
    useShallow((s) =>
      blockers
        ? Object.fromEntries(blockers.map((b) => [b.id, s.tasks[b.id]]))
        : NONE,
    ),
  );
  return isBlocked(blockers, live, finish);
}
