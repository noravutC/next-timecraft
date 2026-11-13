import { describe, expect, it } from 'vitest';
import {
  changeText,
  deliveryDetail,
  isAccepted,
  MAX_WEBHOOK_ATTEMPTS,
  nextAttemptAt,
  pingPayload,
  taskPayload,
  webhookUrlProblem,
} from './webhook';

const now = new Date('2026-11-12T03:00:00Z');
const minutesAfter = (attempts: number) => {
  const next = nextAttemptAt(attempts, now);
  return next ? (next.getTime() - now.getTime()) / 60_000 : null;
};

describe('trying a webhook again', () => {
  it('waits longer each time, then gives up after the fifth try', () => {
    expect([1, 2, 3, 4].map(minutesAfter)).toEqual([1, 10, 60, 720]);
    expect(minutesAfter(MAX_WEBHOOK_ATTEMPTS)).toBeNull();
  });

  it('only a 2xx answer is accepted', () => {
    expect(isAccepted(200)).toBe(true);
    expect(isAccepted(204)).toBe(true);
    expect(isAccepted(302)).toBe(false);
    expect(isAccepted(500)).toBe(false);
    expect(isAccepted(null)).toBe(false);
  });
});

describe('a webhook address', () => {
  it('must be https and carry no login', () => {
    expect(webhookUrlProblem('https://hooks.example.com/x')).toBeNull();
    expect(webhookUrlProblem('http://hooks.example.com/x')).toBe(
      'The address must start with https://',
    );
    expect(webhookUrlProblem('ftp://example.com')).toBe(
      'The address must start with https://',
    );
    expect(webhookUrlProblem('not a url')).toBe('That is not a web address');
    expect(webhookUrlProblem('https://user:pw@example.com')).toBe(
      'Leave the user name and password out of the address',
    );
  });

  it('allows http only when testing locally', () => {
    expect(webhookUrlProblem('http://localhost:9000/hook', true)).toBeNull();
  });
});

describe('what is sent', () => {
  it('puts a change in the history’s words', () => {
    expect(
      changeText(
        {
          type: 'moved',
          data: {
            from: { id: 'a', name: 'In progress', color: null },
            to: { id: 'b', name: 'Review', color: null },
          },
        },
        now,
      ),
    ).toBe('moved this from In progress to Review');
    expect(
      changeText(
        { type: 'priority_changed', data: { from: 'medium', to: 'high' } },
        now,
      ),
    ).toBe('set priority to High from Medium');
  });

  it('carries the task as it was, with a link to it', () => {
    const payload = taskPayload({
      event: 'task.finished',
      board: { id: 'b1', name: 'Website Relaunch' },
      task: {
        id: 't1',
        title: 'Build images',
        priority: 'low',
        dueDate: null,
        tags: ['Infra'],
      },
      columnName: 'Done',
      change: 'moved this from Review to Done',
      actorName: 'Noravut C.',
      baseUrl: 'https://app.example.com',
      now,
    });
    expect(payload).toEqual({
      event: 'task.finished',
      sentAt: '2026-11-12T03:00:00.000Z',
      board: { id: 'b1', name: 'Website Relaunch' },
      task: {
        id: 't1',
        title: 'Build images',
        column: 'Done',
        priority: 'low',
        dueDate: null,
        labels: ['Infra'],
        url: 'https://app.example.com/project?board=b1&task=t1',
      },
      change: 'moved this from Review to Done',
      actor: { name: 'Noravut C.' },
    });
  });

  it('a test carries only the board', () => {
    expect(pingPayload({ id: 'b1', name: 'Board' }, now)).toEqual({
      event: 'ping',
      sentAt: '2026-11-12T03:00:00.000Z',
      board: { id: 'b1', name: 'Board' },
    });
  });
});

describe('how a message went, in a few words', () => {
  const base = {
    status: 'pending' as const,
    attempts: 0,
    responseStatus: null,
    durationMs: null,
    error: null,
  };
  it('covers waiting, accepted, refused and no answer', () => {
    expect(deliveryDetail(base)).toBe('Waiting to be sent');
    expect(
      deliveryDetail({
        ...base,
        status: 'sent',
        attempts: 1,
        responseStatus: 200,
        durationMs: 182,
      }),
    ).toBe('200 in 182 ms');
    expect(deliveryDetail({ ...base, attempts: 3, responseStatus: 500 })).toBe(
      '500 · try 3 of 5',
    );
    expect(
      deliveryDetail({
        ...base,
        status: 'failed',
        attempts: 5,
        error: 'No answer in 10 seconds',
      }),
    ).toBe('No answer in 10 seconds · try 5 of 5');
  });
});
