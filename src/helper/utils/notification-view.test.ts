import { describe, expect, it } from 'vitest';
import type { Notification } from '@/types';
import {
  filterNotifications,
  formatNotificationTime,
  groupNotificationsByDay,
  notificationParts,
  notificationTabCounts,
  notificationTarget,
} from './notification-view';

const make = (
  id: string,
  type: Notification['type'],
  read: boolean,
): Notification =>
  ({
    id,
    userId: 'me',
    type,
    readAt: read ? new Date() : null,
    createdAt: new Date(),
    payload: {
      taskId: 't1',
      commentId: 'c1',
      projectId: 'p1',
      actorUserId: 'u2',
      actorName: 'Ploy S.',
      taskTitle: 'Migrate sign-in',
      projectName: 'Website Relaunch',
      snippet: '',
    },
  }) as unknown as Notification;

const items = [
  make('1', 'comment_mention', false),
  make('2', 'comment_reply', false),
  make('3', 'board_invite', true),
];

describe('filterNotifications', () => {
  it('keeps everything on All', () => {
    expect(filterNotifications(items, 'all')).toHaveLength(3);
  });
  it('keeps unread ones on Unread', () => {
    expect(filterNotifications(items, 'unread').map((n) => n.id)).toEqual([
      '1',
      '2',
    ]);
  });
  it('keeps mentions on Mentions', () => {
    expect(filterNotifications(items, 'mentions').map((n) => n.id)).toEqual([
      '1',
    ]);
  });
});

describe('notificationTabCounts', () => {
  it('counts loaded items, server unread and mentions', () => {
    expect(notificationTabCounts(items, 7)).toEqual({
      all: 3,
      unread: 7,
      mentions: 1,
    });
  });
});

describe('notificationTarget', () => {
  it('names the task for task notifications and the board otherwise', () => {
    expect(notificationTarget(items[0])).toBe('Migrate sign-in');
    expect(notificationTarget(items[2])).toBe('Website Relaunch');
  });

  it('names the workspace for a workspace invitation', () => {
    expect(
      notificationTarget({
        type: 'workspace_invite',
        payload: {
          organizationId: 'o1',
          organizationName: 'Northwind Studio',
          actorUserId: 'u1',
          actorName: 'Ploy S.',
          role: 'member',
          token: 't',
        },
      }),
    ).toBe('Northwind Studio');
  });
});

describe('formatNotificationTime', () => {
  const now = new Date('2026-11-06T12:00:00Z').getTime();
  const ago = (days: number) => new Date(now - days * 86_400_000);

  it('uses relative minutes and hours within a day', () => {
    expect(formatNotificationTime(new Date())).toBe('just now');
  });
  it('says Yesterday, then N days ago within a week', () => {
    expect(formatNotificationTime(ago(1), now)).toBe('Yesterday');
    expect(formatNotificationTime(ago(4), now)).toBe('4 days ago');
  });
  it('falls back to a short date after a week', () => {
    expect(formatNotificationTime(ago(10), now)).toMatch(/2026/);
  });
});

describe('notificationParts', () => {
  it('reads a role change with the role in bold', () => {
    expect(
      notificationParts({
        type: 'role_changed',
        payload: {
          projectId: 'p',
          projectName: 'Mobile App v2',
          actorUserId: 'u',
          actorName: 'Ploy S.',
          role: 'admin',
        },
      }),
    ).toEqual({
      before: 'made you',
      strong: 'an Admin',
      after: 'on Mobile App v2',
    });
  });

  it('names what an accepted invitation was for', () => {
    expect(
      notificationParts({
        type: 'invite_accepted',
        payload: {
          organizationId: 'o',
          organizationName: 'Northwind',
          actorUserId: 'u',
          actorName: 'Mint T.',
        },
      }).strong,
    ).toBe('Northwind');
  });
});

describe('groupNotificationsByDay', () => {
  it('groups into Today, Yesterday, Earlier this week and Older', () => {
    const now = new Date(2026, 10, 6, 12);
    const at = (daysAgo: number) => ({
      createdAt: new Date(2026, 10, 6 - daysAgo, 9),
    });
    expect(
      groupNotificationsByDay([at(0), at(1), at(3), at(9)], now).map(
        (g) => g.day,
      ),
    ).toEqual(['Today', 'Yesterday', 'Earlier this week', 'Older']);
  });
});
