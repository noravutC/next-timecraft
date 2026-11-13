import { describe, expect, it } from 'vitest';
import type { HistoryItem } from '@/types';
import {
  historyDays,
  recentRuns,
  runWhen,
  untilText,
} from './history-operations';

const BKK = 'Asia/Bangkok';
// Thursday Nov 12, 2026, 12:00 in Bangkok
const now = new Date('2026-11-12T05:00:00Z');
const at = (iso: string) => new Date(iso);

const run = (
  over: Partial<Extract<HistoryItem, { kind: 'run' }>>,
): HistoryItem => ({
  kind: 'run',
  id: 'r',
  ruleId: 'rule',
  rule: 'When a task moves to Review',
  trigger: 'task_moved',
  taskId: 't1',
  taskTitle: 'Realtime presence on cards',
  status: 'done',
  detail: 'Assigned Ploy S.',
  createdAt: at('2026-11-12T03:42:00Z'),
  ...over,
});
const delivery = (
  over: Partial<Extract<HistoryItem, { kind: 'delivery' }>>,
): HistoryItem => ({
  kind: 'delivery',
  id: 'd',
  webhookId: 'w',
  webhookName: 'Status page sync',
  url: 'https://status.example/api',
  event: 'task.finished',
  taskId: 't1',
  taskTitle: 'Build images',
  status: 'pending',
  attempts: 3,
  responseStatus: 500,
  durationMs: 1200,
  error: '500 Internal Server Error',
  nextAttemptAt: at('2026-11-12T05:10:00Z'),
  payload: {
    event: 'task.finished',
    sentAt: 'x',
    board: { id: 'b', name: 'B' },
  },
  createdAt: at('2026-11-12T02:58:00Z'),
  ...over,
});

describe('History by day', () => {
  it('names today and yesterday, and older days in full', () => {
    const days = historyDays(
      [
        run({}),
        run({ id: 'y', createdAt: at('2026-11-11T09:05:00Z') }),
        run({
          id: 'm',
          trigger: 'schedule',
          createdAt: at('2026-11-09T02:00:00Z'),
        }),
      ],
      now,
      BKK,
    );
    expect(days.map((d) => d.day)).toEqual([
      'Today',
      'Yesterday',
      'Monday, Nov 9',
    ]);
    expect(days[0].rows[0]).toMatchObject({
      time: '10:42',
      tone: 'change',
      sub: 'Rule',
      chip: { text: 'Done', tone: 'good' },
      failure: null,
    });
    expect(days[2].rows[0]).toMatchObject({
      time: '09:00',
      tone: 'schedule',
      sub: 'Rule on a schedule',
    });
  });

  it('keeps the rows of one day together', () => {
    const days = historyDays([run({}), delivery({})], now, BKK);
    expect(days).toHaveLength(1);
    expect(days[0].rows.map((r) => r.kind)).toEqual(['run', 'delivery']);
  });

  it('marks rules that need a fix or failed', () => {
    const [day] = historyDays(
      [run({ status: 'needs_fix' }), run({ id: 'f', status: 'failed' })],
      now,
      BKK,
    );
    expect(day.rows.map((r) => r.chip)).toEqual([
      { text: 'Needs a fix', tone: 'warn' },
      { text: 'Failed', tone: 'bad' },
    ]);
  });
});

describe('a webhook message', () => {
  const rowOf = (item: HistoryItem) => historyDays([item], now, BKK)[0].rows[0];

  it('that is retrying says what was answered and when it tries next', () => {
    const row = rowOf(delivery({}));
    expect(row).toMatchObject({
      name: 'Status page sync',
      sub: 'Webhook · Task finished',
      chip: { text: 'Failed', tone: 'bad' },
      detail: '500 · try 3 of 5',
    });
    expect(row.failure).toMatchObject({
      lead: 'The receiver answered',
      answer: '500 Internal Server Error',
      rest: 'after 1.2 seconds. This was try 3 of 5. The next one is in 10 minutes.',
    });
    expect(row.failure?.request).toBe(
      'POST https://status.example/api\nX-TimeCraft-Event: task.finished\nX-TimeCraft-Delivery: d',
    );
    expect(JSON.parse(row.failure?.payload ?? '{}').event).toBe(
      'task.finished',
    );
  });

  it('that was given up on says so', () => {
    const row = rowOf(
      delivery({
        status: 'failed',
        attempts: 5,
        responseStatus: null,
        durationMs: null,
        error: 'No answer in 10 seconds',
      }),
    );
    expect(row.failure).toMatchObject({
      lead: 'It did not get through:',
      answer: 'No answer in 10 seconds',
      rest: 'It was tried 5 times and will not be sent again by itself.',
    });
  });

  it('that got through, or has not been tried, has nothing to explain', () => {
    expect(
      rowOf(
        delivery({
          status: 'sent',
          attempts: 1,
          responseStatus: 200,
          durationMs: 182,
          error: null,
        }),
      ),
    ).toMatchObject({
      chip: { text: 'Sent', tone: 'good' },
      detail: '200 in 182 ms',
      failure: null,
    });
    expect(
      rowOf(delivery({ attempts: 0, responseStatus: null })),
    ).toMatchObject({
      chip: { text: 'Waiting', tone: 'wait' },
      failure: null,
    });
  });

  it('answers in under a second are told in milliseconds', () => {
    expect(rowOf(delivery({ durationMs: 3 })).failure?.rest).toMatch(
      /^after 3 ms\./,
    );
  });
});

describe('times in words', () => {
  it('runs: today, yesterday, or the day', () => {
    expect(runWhen(at('2026-11-12T03:42:00Z'), now, BKK)).toBe('Today, 10:42');
    expect(runWhen(at('2026-11-11T09:05:00Z'), now, BKK)).toBe(
      'Yesterday, 16:05',
    );
    expect(runWhen(at('2026-11-10T04:20:00Z'), now, BKK)).toBe(
      'Tue, Nov 10, 11:20',
    );
  });

  it('the next try', () => {
    expect(untilText(at('2026-11-12T05:00:20Z'), now)).toBe('any moment now');
    expect(untilText(at('2026-11-12T05:01:00Z'), now)).toBe('in 1 minute');
    expect(untilText(at('2026-11-12T05:10:00Z'), now)).toBe('in 10 minutes');
    expect(untilText(at('2026-11-12T06:00:00Z'), now)).toBe('in 1 hour');
    expect(untilText(at('2026-11-12T17:00:00Z'), now)).toBe('in 12 hours');
  });

  it('a rule’s last runs: three at most, what it ran on or what went wrong', () => {
    const runs = recentRuns(
      [
        run({}),
        delivery({}),
        run({
          id: 'b',
          status: 'needs_fix',
          detail: 'The label Triage was deleted',
        }),
        run({
          id: 'c',
          taskTitle: '',
          detail: 'Created Weekly review in To do',
        }),
        run({ id: 'd' }),
      ],
      now,
      BKK,
    );
    expect(runs.map((r) => [r.ok, r.text])).toEqual([
      [true, 'Realtime presence on cards'],
      [false, 'The label Triage was deleted'],
      [true, 'Created Weekly review in To do'],
    ]);
  });
});
