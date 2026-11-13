import type {
  AutomationNotificationPayload,
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  DueReminderNotificationPayload,
  InviteAcceptedNotificationPayload,
  Notification,
  RoleChangedNotificationPayload,
  WorkspaceInviteNotificationPayload,
} from '@/types';
import { ROLE_LABELS } from '@/lib/rbac/role-labels';
import type { ProjectRole } from '@/lib/rbac/permissions';
import { formatDateShort, formatRelativePast } from './date-format';

export type NotificationTab = 'all' | 'unread' | 'mentions';

const MS_PER_DAY = 86_400_000;

const isMention = (n: Pick<Notification, 'type'>) =>
  n.type === 'comment_mention';

/** Notifications about a task open that task when clicked. */
export const isTaskNotification = (n: Pick<Notification, 'type'>) =>
  n.type === 'comment_mention' ||
  n.type === 'comment_reply' ||
  n.type === 'task_assigned' ||
  n.type === 'due_reminder' ||
  n.type === 'automation';

/** "Due today", "Due tomorrow", "Due in 2 days", "Due in a week" */
export const dueReminderLabel = (daysBefore: number): string =>
  daysBefore === 0
    ? 'Due today'
    : daysBefore === 1
      ? 'Due tomorrow'
      : daysBefore === 7
        ? 'Due in a week'
        : `Due in ${daysBefore} days`;

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

/** The chips on the notifications page, and the types each one shows. */
export const NOTIFICATION_KINDS = {
  all: null,
  unread: null,
  mentions: ['comment_mention'],
  assigned: ['task_assigned'],
  due: ['due_reminder'],
  invites: ['board_invite', 'workspace_invite'],
} as const satisfies Record<string, readonly Notification['type'][] | null>;

export type NotificationKind = keyof typeof NOTIFICATION_KINDS;

/** Chip counts from per-type totals: All and Unread count everything. */
export const kindCounts = (
  rows: { type: Notification['type']; unread: number; total: number }[],
): Record<NotificationKind, number> => {
  const totalOf = (types: readonly Notification['type'][]) =>
    rows
      .filter((r) => types.includes(r.type))
      .reduce((sum, r) => sum + r.total, 0);
  return {
    all: rows.reduce((sum, r) => sum + r.total, 0),
    unread: rows.reduce((sum, r) => sum + r.unread, 0),
    mentions: totalOf(NOTIFICATION_KINDS.mentions),
    assigned: totalOf(NOTIFICATION_KINDS.assigned),
    due: totalOf(NOTIFICATION_KINDS.due),
    invites: totalOf(NOTIFICATION_KINDS.invites),
  };
};

/**
 * The sentence after the actor's name, in three parts: "mentioned you on"
 * **Migrate sign-in** "", or "made you" **an Admin** "on Mobile App v2".
 */
export const notificationParts = (
  n: Pick<Notification, 'type' | 'payload'>,
): {
  before: string;
  strong: string;
  after: string;
  /** from TimeCraft, not a person: a reminder, or a rule on a board */
  system?: 'due' | 'rule';
} => {
  switch (n.type) {
    // from TimeCraft, not a person: "**Due tomorrow:** Set up Resend domain"
    case 'due_reminder': {
      const p = n.payload as DueReminderNotificationPayload;
      return {
        before: '',
        strong: `${dueReminderLabel(p.daysBefore)}:`,
        after: p.taskTitle,
        system: 'due',
      };
    }
    // from a rule: "**When a task is finished:** Build images"
    case 'automation': {
      const p = n.payload as AutomationNotificationPayload;
      return {
        before: '',
        strong: `${p.rule}:`,
        after: p.taskTitle,
        system: 'rule',
      };
    }
    case 'comment_mention':
      return {
        before: 'mentioned you on',
        strong: notificationTarget(n),
        after: '',
      };
    case 'comment_reply':
      return {
        before: 'commented on',
        strong: notificationTarget(n),
        after: '',
      };
    case 'task_assigned':
      return {
        before: 'assigned you to',
        strong: notificationTarget(n),
        after: '',
      };
    case 'board_invite':
    case 'workspace_invite':
      return {
        before: 'invited you to',
        strong: notificationTarget(n),
        after: '',
      };
    case 'member_removed':
      return {
        before: 'removed you from',
        strong: notificationTarget(n),
        after: '',
      };
    case 'role_changed': {
      const p = n.payload as RoleChangedNotificationPayload;
      const label = ROLE_LABELS[p.role as ProjectRole] ?? p.role;
      const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
      return {
        before: 'made you',
        strong: `${article} ${label}`,
        after: `on ${p.projectName}`,
      };
    }
    case 'invite_accepted': {
      const p = n.payload as InviteAcceptedNotificationPayload;
      return {
        before: 'accepted your invitation to',
        strong: p.projectName ?? p.organizationName ?? 'your workspace',
        after: '',
      };
    }
  }
};

/** The board a notification is about, for its chip; null for workspaces. */
export const notificationBoard = (
  n: Pick<Notification, 'payload'>,
): { id: string; name: string } | null => {
  const p = n.payload as { projectId?: string; projectName?: string };
  return p.projectId && p.projectName
    ? { id: p.projectId, name: p.projectName }
    : null;
};

export type NotificationDay =
  | 'Today'
  | 'Yesterday'
  | 'Earlier this week'
  | 'Older';

/** Today, Yesterday, Earlier this week (the last 7 days), Older. */
export const groupNotificationsByDay = <T extends { createdAt: Date | string }>(
  items: T[],
  now: Date = new Date(),
): { day: NotificationDay; items: T[] }[] => {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOf(now);
  const dayOf = (createdAt: Date | string): NotificationDay => {
    const diff = (today - startOf(new Date(createdAt))) / MS_PER_DAY;
    if (diff <= 0) return 'Today';
    if (diff <= 1) return 'Yesterday';
    if (diff < 7) return 'Earlier this week';
    return 'Older';
  };
  const groups: { day: NotificationDay; items: T[] }[] = [];
  for (const item of items) {
    const day = dayOf(item.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
};
