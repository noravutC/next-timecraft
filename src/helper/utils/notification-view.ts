import type {
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  Notification,
  WorkspaceInviteNotificationPayload,
} from '@/types';
import { formatDateShort, formatRelativePast } from './date-format';

export type NotificationTab = 'all' | 'unread' | 'mentions';

const MS_PER_DAY = 86_400_000;

const isMention = (n: Pick<Notification, 'type'>) =>
  n.type === 'comment_mention';

/** Notifications about a task open that task when clicked. */
export const isTaskNotification = (n: Pick<Notification, 'type'>) =>
  n.type === 'comment_mention' ||
  n.type === 'comment_reply' ||
  n.type === 'task_assigned';

/** Bold object at the end of the sentence: the task, board or workspace name. */
export const notificationTarget = (
  n: Pick<Notification, 'type' | 'payload'>,
): string => {
  if (isTaskNotification(n)) {
    return (n.payload as CommentNotificationPayload).taskTitle;
  }
  if (n.type === 'workspace_invite') {
    return (n.payload as WorkspaceInviteNotificationPayload).organizationName;
  }
  return (n.payload as BoardInviteNotificationPayload).projectName;
};

/** What each filter chip shows. */
export const filterNotifications = (
  items: Notification[],
  tab: NotificationTab,
): Notification[] => {
  if (tab === 'unread') return items.filter((n) => !n.readAt);
  if (tab === 'mentions') return items.filter(isMention);
  return items;
};

/**
 * Counts on the filter chips. Unread comes from the server total so it also
 * covers notifications on pages that aren't loaded yet.
 */
export const notificationTabCounts = (
  items: Notification[],
  unreadCount: number,
): Record<NotificationTab, number> => ({
  all: items.length,
  unread: unreadCount,
  mentions: items.filter(isMention).length,
});

/** "12m ago" · "3h ago" · "Yesterday" · "2 days ago" · "Nov 03, 2026" */
export const formatNotificationTime = (
  date: Date,
  now: number = Date.now(),
): string => {
  const days = Math.floor((now - date.getTime()) / MS_PER_DAY);
  if (days < 1) return formatRelativePast(date);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDateShort(date);
};
