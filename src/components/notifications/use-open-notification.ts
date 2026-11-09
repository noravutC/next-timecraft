import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { taskServices } from '@/services/tasks.service';
import { useNotificationStore } from '@/store/use-notification.store';
import { useTaskDetailStore } from '@/store/use-task-detail.store';
import { useProjectStore } from '@/store';
import type {
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  Notification,
} from '@/types';

/**
 * Click on a notification: mark it read, close the popover, then go where it
 * points (invite page, open task) or sync the board list for a removal.
 */
export function useOpenNotification(onNavigate: () => void) {
  const router = useRouter();
  const markRead = useNotificationStore((s) => s.markRead);
  const openTask = useTaskDetailStore((s) => s.open);
  const setProjectIsUsing = useProjectStore((s) => s.setProjectIsUsing);
  const removeProject = useProjectStore((s) => s.removeProject);

  return async (n: Notification) => {
    if (!n.readAt) markRead([n.id]);
    onNavigate();
    if (n.type === 'board_invite') {
      router.push(
        `/invite/${(n.payload as BoardInviteNotificationPayload).token}`,
      );
      return;
    }
    if (n.type === 'member_removed') {
      // nothing left to open: drop the board from our list
      removeProject(n.payload.projectId);
      return;
    }
    // comment_mention / comment_reply / task_assigned open the task
    const payload = n.payload as CommentNotificationPayload;
    try {
      // the task may be gone; ask the server, since the client store doesn't
      // know tasks of boards that aren't loaded
      await taskServices.getTasksByIds([payload.taskId]);
    } catch {
      toast.error('This task is no longer available');
      return;
    }
    setProjectIsUsing(payload.projectId);
    openTask(payload.taskId);
  };
}
