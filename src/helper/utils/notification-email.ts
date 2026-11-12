import type {
  AutomationNotificationPayload,
  CommentNotificationPayload,
  DueReminderNotificationPayload,
  InviteAcceptedNotificationPayload,
  MemberRemovedNotificationPayload,
  NotificationPayload,
  NotificationRow,
  RoleChangedNotificationPayload,
  TaskAssignedNotificationPayload,
} from '@/types';
import { boardUrl } from './board-url';
import { dueReminderLabel, notificationParts } from './notification-view';

export type NotificationEmailContent = {
  subject: string;
  heading: string;
  body: string;
  quote?: { by: string; text: string };
  task?: { title: string; meta: string; due?: string };
  cta: { label: string; href: string };
  why: string;
};

/**
 * What a notification says by email. Null for kinds that are mailed where
 * they happen (invitations carry their own link).
 */
export const notificationEmailContent = (
  type: NotificationRow['type'],
  payload: NotificationPayload,
  options: { baseUrl: string; timeZone: string },
): NotificationEmailContent | null => {
  const url = (path: string) => `${options.baseUrl}${path}`;
  const taskLink = (p: { projectId: string; taskId: string }) =>
    url(boardUrl({ board: p.projectId, task: p.taskId }));
  const { before, strong, after } = notificationParts({ type, payload });
  const actor = 'actorName' in payload ? payload.actorName : '';
  const sentence = `${actor} ${before} ${strong}${after ? ` ${after}` : ''}`;

  switch (type) {
    case 'comment_mention':
    case 'comment_reply': {
      const p = payload as CommentNotificationPayload;
      return {
        subject: `${actor} ${before} “${p.taskTitle}”`,
        heading: sentence,
        body: `On the ${p.projectName} board.`,
        quote: { by: actor, text: p.snippet },
        cta: { label: 'Reply in TimeCraft', href: taskLink(p) },
        why:
          type === 'comment_mention'
            ? 'You got this because someone mentioned you. Turn off mention emails in'
            : 'You got this because you’re on this task. Turn off reply emails in',
      };
    }
    case 'task_assigned': {
      const p = payload as TaskAssignedNotificationPayload;
      return {
        subject: `${actor} assigned you to “${p.taskTitle}”`,
        heading: sentence,
        body: `On the ${p.projectName} board.`,
        task: { title: p.taskTitle, meta: p.projectName },
        cta: { label: 'Open task', href: taskLink(p) },
        why: 'You got this because someone assigned you a task. Change assignment emails in',
      };
    }
    case 'due_reminder': {
      const p = payload as DueReminderNotificationPayload;
      const label = dueReminderLabel(p.daysBefore);
      const due = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: p.timeZone || options.timeZone,
      }).format(new Date(p.dueDate));
      return {
        subject: `${label}: ${p.taskTitle}`,
        heading: `A task of yours is ${label.charAt(0).toLowerCase()}${label.slice(1)}`,
        body:
          p.daysBefore === 0
            ? 'A reminder was set for the day it’s due.'
            : `A reminder was set for ${p.daysBefore === 7 ? '1 week' : `${p.daysBefore} ${p.daysBefore === 1 ? 'day' : 'days'}`} before the due date.`,
        task: { title: p.taskTitle, meta: p.projectName, due: `Due ${due}` },
        cta: { label: 'Open task', href: taskLink(p) },
        why: 'You got this because you’re assigned to this task. Change reminder emails in',
      };
    }
    case 'role_changed': {
      const p = payload as RoleChangedNotificationPayload;
      return {
        subject: sentence,
        heading: sentence,
        body: `On the ${p.projectName} board.`,
        cta: {
          label: 'Open board',
          href: url(boardUrl({ board: p.projectId })),
        },
        why: 'You got this because your role on a board changed. Change these emails in',
      };
    }
    case 'member_removed': {
      const p = payload as MemberRemovedNotificationPayload;
      return {
        subject: `${actor} removed you from ${p.projectName}`,
        heading: sentence,
        body: 'You no longer have access to it.',
        cta: { label: 'Open TimeCraft', href: url('/project') },
        why: 'You got this because you were removed from a board. Change these emails in',
      };
    }
    case 'invite_accepted': {
      const p = payload as InviteAcceptedNotificationPayload;
      return {
        subject: sentence,
        heading: sentence,
        body: 'They can open it now.',
        cta: p.projectId
          ? { label: 'Open board', href: url(boardUrl({ board: p.projectId })) }
          : { label: 'Open TimeCraft', href: url('/project') },
        why: 'You got this because you invited them. Change these emails in',
      };
    }
    case 'automation': {
      const p = payload as AutomationNotificationPayload;
      return {
        subject: `${p.rule}: ${p.taskTitle}`,
        heading: `A rule on ${p.projectName} has something for you`,
        body: `${p.rule}.`,
        task: { title: p.taskTitle, meta: p.projectName },
        cta: { label: 'Open task', href: taskLink(p) },
        why: 'You got this because a rule on this board notifies you. Change rule emails in',
      };
    }
    case 'board_invite':
    case 'workspace_invite':
      return null;
  }
};
