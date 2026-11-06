import { fetchSubtaskProgress } from '@/db/uniq-query/task/subtask-progress';
import { triggerExclusive } from '@/lib/pusher-server';

/**
 * Tell everyone on the board that a card's subtask count changed, so cards
 * show the new done/total without anyone opening the task. The sender's own
 * socket is skipped: its sheet already has the live list.
 */
export async function broadcastSubtaskProgress(
  request: Request,
  projectId: string,
  taskId: string,
) {
  const progress = (await fetchSubtaskProgress([taskId]))[taskId] ?? {
    done: 0,
    total: 0,
  };
  await triggerExclusive(request, `project-${projectId}`, 'subtask-progress', {
    taskId,
    ...progress,
  });
}
