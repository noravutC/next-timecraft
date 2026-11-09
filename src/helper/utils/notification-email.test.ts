import { describe, expect, it } from 'vitest';
import { notificationEmailContent } from './notification-email';

const options = { baseUrl: 'https://tc.example', timeZone: 'Asia/Bangkok' };
const p = '11111111-1111-4111-8111-111111111111';
const t = '22222222-2222-4222-8222-222222222222';

describe('notificationEmailContent', () => {
  it('quotes a mention and links to the task', () => {
    const content = notificationEmailContent(
      'comment_mention',
      {
        taskId: t,
        commentId: 'c',
        projectId: p,
        actorUserId: 'u',
        actorName: 'Ploy S.',
        taskTitle: 'Migrate sign-in',
        projectName: 'Website Relaunch',
        snippet: '@Noravut can we keep the 48 hour session?',
      },
      options,
    );
    expect(content?.subject).toBe('Ploy S. mentioned you on “Migrate sign-in”');
    expect(content?.quote?.text).toContain('48 hour');
    expect(content?.cta.href).toBe(
      `https://tc.example/project?board=${p}&task=${t}`,
    );
  });

  it('reminds with the due day in the workspace zone', () => {
    const content = notificationEmailContent(
      'due_reminder',
      {
        taskId: t,
        taskTitle: 'Set up Resend domain',
        projectId: p,
        projectName: 'Website Relaunch',
        dueDate: '2026-11-07T05:00:00.000Z',
        daysBefore: 1,
        timeZone: 'Asia/Bangkok',
        actorUserId: '',
        actorName: 'TimeCraft',
      },
      options,
    );
    expect(content?.subject).toBe('Due tomorrow: Set up Resend domain');
    expect(content?.heading).toBe('A task of yours is due tomorrow');
    expect(content?.task?.due).toBe('Due Sat, Nov 7');
  });

  it('leaves invitations to the emails they already send', () => {
    expect(
      notificationEmailContent(
        'board_invite',
        {
          projectId: p,
          projectName: 'X',
          actorUserId: 'u',
          actorName: 'A',
          role: 'editor',
          token: 'k',
        },
        options,
      ),
    ).toBeNull();
  });
});
