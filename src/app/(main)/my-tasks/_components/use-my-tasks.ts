'use client';

import { useEffect, useState } from 'react';
import { taskServices } from '@/services/tasks.service';
import { useProjectStore } from '@/store';
import type { MyTask } from '@/types';

/** Your tasks, and the boards (for names and avatars) they're on. */
export function useMyTasks() {
  const [tasks, setTasks] = useState<MyTask[] | null>(null);
  const [failed, setFailed] = useState(false);
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  useEffect(() => {
    let active = true;
    taskServices
      .getMyTasks()
      .then((data) => active && setTasks(data))
      .catch(() => active && setFailed(true));
    // this page may be the first one open: the boards aren't loaded yet
    if (Object.keys(useProjectStore.getState().projects).length === 0) {
      fetchProjects([], true).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [fetchProjects]);

  return { tasks, failed };
}
