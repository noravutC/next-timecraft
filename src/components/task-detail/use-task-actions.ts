'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useBoardAccess } from '@/components/project/use-board-access';
import { offerUndo } from '@/components/undo/offer-undo';
import { boardsToMoveTo } from '@/helper/utils/board-switcher';
import { useProjectStore } from '@/store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useTaskStore } from '@/store/use-task.store';
import type { ProjectCache, Task } from '@/types';

const failed = (error: unknown, fallback: string) =>
  toast.error((error as { message?: string })?.message ?? fallback);

/** Duplicate, move to another board, archive, delete: the task sheet's ⋯. */
export function useTaskActions(task: Task | undefined) {
  const { data: session } = useSession();
  const access = useBoardAccess();
  const projects = useProjectStore((s) => s.projects);
  const projectIsUsing = useProjectStore((s) => s.projectIsUsing);
  const duplicateTask = useTaskStore((s) => s.duplicateTask);
  const moveTaskToBoard = useTaskStore((s) => s.moveTaskToBoard);
  const updateTasks = useTaskStore((s) => s.updateTasks);
  const deleteTasks = useTaskStore((s) => s.deleteTasks);
  const close = useTaskDetailStore((s) => s.close);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const targets = boardsToMoveTo(
    Object.values(projects),
    projectIsUsing,
    session?.user?.id ?? null,
  );

  const setArchived = (archived: boolean) =>
    task &&
    updateTasks(
      [task.id],
      [{ id: task.id, columnId: task.columnId, title: task.title, archived }],
    );

  return {
    can: {
      duplicate: access.can('task:create'),
      move: access.can('task:update') && targets.length > 0,
      archive: access.can('task:update'),
      delete: access.can('task:delete'),
    },
    targets,
    duplicate: async () => {
      if (!task) return;
      try {
        await duplicateTask(task.id);
        toast.success('Task duplicated');
      } catch (error) {
        failed(error, 'Couldn’t duplicate the task');
      }
    },
    moveTo: async (board: ProjectCache) => {
      if (!task) return;
      try {
        await moveTaskToBoard(task.id, board.id);
        close();
        toast.success(`Moved to ${board.name}`);
      } catch (error) {
        failed(error, 'Couldn’t move the task');
      }
    },
    archive: () => {
      if (!task) return;
      close();
      setArchived(true)?.catch((error) => failed(error, 'Couldn’t archive it'));
      offerUndo({
        icon: 'archive',
        title: 'Task archived',
        detail: task.title,
        undo: async () => setArchived(false),
        undoneTitle: 'Back on the board',
        redo: { label: 'Archive again', run: async () => setArchived(true) },
      });
    },
    confirmDelete,
    setConfirmDelete,
    remove: async () => {
      if (!task) return;
      setConfirmDelete(false);
      try {
        await deleteTasks([task.id]);
        close();
        toast.success('Task deleted');
      } catch (error) {
        failed(error, 'Couldn’t delete the task');
      }
    },
  };
}

export type TaskActions = ReturnType<typeof useTaskActions>;
