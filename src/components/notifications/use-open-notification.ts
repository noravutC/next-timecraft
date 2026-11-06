import { usePathname, useRouter } from 'next/navigation';
import { boardUrl } from '@/helper/utils/board-url';
import { useNotificationStore } from '@/store/use-notification.store';
import { useProjectStore } from '@/store';
import { useOpenTask } from '@/components/task-detail/use-open-task';
import type {
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  MemberRemovedNotificationPayload,
  Notification,
  WorkspaceInviteNotificationPayload,
} from '@/types';

/**
 * Click on a notification: mark it read, close the popover, then go where it
 * points (invite page, open task) or sync the board list for a removal.
 */
export function useOpenNotification(onNavigate: () => void) {
  const router = useRouter();
  const pathname = usePathname();
  const markRead = useNotificationStore((s) => s.markRead);
  const openTask = useOpenTask();
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
    if (n.type === 'workspace_invite') {
      router.push(
        `/join/${(n.payload as WorkspaceInviteNotificationPayload).token}`,
      );
      return;
    }
    if (n.type === 'member_removed') {
      // nothing left to open: drop the board from our list
      removeProject((n.payload as MemberRemovedNotificationPayload).projectId);
      return;
    }
    // comment_mention / comment_reply / task_assigned open the task; away
    // from the board (settings), go to the board with the task open
    const { taskId, projectId } = n.payload as CommentNotificationPayload;
    if (!pathname.startsWith('/project')) {
      router.push(boardUrl({ board: projectId, task: taskId }));
      return;
    }
    await openTask(taskId);
  };
}
