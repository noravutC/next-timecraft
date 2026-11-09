import { useCallback } from 'react';
import { toast } from 'sonner';
import { taskServices } from '@/services/tasks.service';
import { useProjectStore } from '@/store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useTaskStore } from '@/store/use-task.store';

/**
 * Opens a task from outside its board (a shared link, a notification): asks
 * the server whether it still exists and the user may see it, switches to its
 * board, then shows it in the task sheet. Resolves false when it can't.
 */
export function useOpenTask() {
  const setProjectIsUsing = useProjectStore((s) => s.setProjectIsUsing);
  const upsertOpenedTask = useTaskStore((s) => s.upsertOpenedTask);
  const openTask = useTaskDetailStore((s) => s.open);

  return useCallback(
    async (taskId: string): Promise<boolean> => {
      try {
        // the client only knows tasks of the loaded board pages
        const { data } = await taskServices.getTasksByIds([taskId]);
        const found = data[0];
        if (!found?.projectId || found.archived) {
          toast.error('This task is no longer available');
          return false;
        }
        const { projectId, ...task } = found;
        setProjectIsUsing(projectId);
        upsertOpenedTask(task);
        openTask(task.id);
        return true;
      } catch {
        toast.error('This task is no longer available');
        return false;
      }
    },
    [setProjectIsUsing, upsertOpenedTask, openTask],
  );
}
