'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { filterArchive } from '@/helper/utils/board-archive';
import { taskServices } from '@/services/tasks.service';
import { useColumnStore } from '@/store/use-column.store';
import { TASK_PAGE_SIZE, useTaskStore } from '@/store/use-task.store';
import type { ArchivedTask, BoardArchive, DeletedColumn } from '@/types';

const failed = (error: unknown, fallback: string) =>
  toast.error((error as { message?: string })?.message ?? fallback);

/** A board's archive: load it, search it, restore or delete from it. */
export function useBoardArchive(projectId: string | null, open: boolean) {
  const [archive, setArchive] = useState<BoardArchive | null>(null);
  const [query, setQuery] = useState('');
  const restoreColumns = useColumnStore((s) => s.restoreColumns);
  const fetchTasksByColumns = useTaskStore((s) => s.fetchTasksByColumns);

  useEffect(() => {
    if (!open || !projectId) return;
    let alive = true;
    taskServices
      .getBoardArchive(projectId)
      .then(({ data }) => alive && setArchive(data))
      .catch(() => alive && setArchive({ tasks: [], columns: [] }));
    return () => {
      alive = false;
    };
  }, [projectId, open]);

  const shown = useMemo(
    () => (archive ? filterArchive(archive, query) : null),
    [archive, query],
  );

  // optimistic: the row leaves at once, and comes back on failure
  const withoutItem = async (
    remove: (a: BoardArchive) => BoardArchive,
    run: () => Promise<unknown>,
    failure: string,
  ) => {
    const before = archive;
    setArchive((a) => a && remove(a));
    try {
      await run();
    } catch (error) {
      setArchive(before);
      failed(error, failure);
    }
  };

  const dropTask = (id: string) => (a: BoardArchive) => ({
    ...a,
    tasks: a.tasks.filter((t) => t.id !== id),
  });

  return {
    archive,
    shown,
    query,
    setQuery,
    count: archive ? archive.tasks.length + archive.columns.length : 0,
    restoreTask: (task: ArchivedTask) =>
      withoutItem(
        dropTask(task.id),
        async () => {
          await taskServices.updateTasks(
            [task.id],
            [
              {
                id: task.id,
                columnId: task.columnId,
                title: task.title,
                archived: false,
              },
            ],
          );
          // the card comes back with everything it shows
          await fetchTasksByColumns([task.columnId], TASK_PAGE_SIZE);
        },
        'Couldn’t restore the task',
      ),
    deleteTask: (task: ArchivedTask) =>
      withoutItem(
        dropTask(task.id),
        () => taskServices.deleteTasks([task.id]),
        'Couldn’t delete the task',
      ),
    restoreColumn: (column: DeletedColumn) =>
      withoutItem(
        (a) => ({ ...a, columns: a.columns.filter((c) => c.id !== column.id) }),
        async () => {
          await restoreColumns([column.id]);
          await fetchTasksByColumns([column.id], TASK_PAGE_SIZE);
        },
        'Couldn’t restore the column',
      ),
  };
}
