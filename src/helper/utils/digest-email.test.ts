import { describe, expect, it } from 'vitest';
import type { AttentionItem, DigestContents } from '@/types';
import { digestEmailContent, digestIsEmpty } from './digest-email';

const BOARD = {
  name: 'Website Relaunch',
  weekKey: '2026-11-09',
  timeZone: 'Asia/Bangkok',
};

const attention = (over: Partial<AttentionItem>): AttentionItem => ({
  id: 't1',
  title: 'Realtime presence on cards',
  kind: 'stuck',
  columnName: 'Review',
  dueDate: null,
  overdueDays: 0,
  idleDays: 7,
  dueInDays: 0,
  waitingOn: null,
  assignees: [],
  ...over,
});

const contents = (over: Partial<DigestContents> = {}): DigestContents => ({
  completed: 8,
  previousCompleted: 4,
  median: 4.2,
  finished: [
    { title: 'Lazy-load columns', by: 'Ploy Srisai' },
    { title: 'Build images on GitHub Actions', by: null },
  ],
  dueThisWeek: 3,
  overdue: 0,
  attention: [
    attention({}),
    attention({ id: 't2', kind: 'overdue', overdueDays: 2 }),
    attention({
      id: 't3',
      kind: 'due_soon',
      dueDate: '2026-11-10T05:00:00Z',
    }),
  ],
  attentionTotal: 5,
  ...over,
});

describe('digestEmailContent', () => {
  it('builds the subject, the week and the three numbers', () => {
    const email = digestEmailContent(contents(), BOARD);
    expect(email.subject).toBe('Website Relaunch: 8 tasks finished last week');
    expect(email.weekLabel).toBe('Week of Nov 2 to Nov 8');
    expect(email.tiles).toEqual([
      {
        value: '8',
        unit: '',
        label: 'Completed',
        note: '4 more than the week before',
      },
      {
        value: '4.2',
        unit: 'days',
        label: 'Time to done',
        note: 'Median, created to Done',
      },
      { value: '3', unit: '', label: 'Due this week', note: 'None overdue' },
    ]);
  });

  it('lists what was finished, with who had it, and how many more', () => {
    const email = digestEmailContent(contents(), BOARD);
    expect(email.finished).toEqual([
      { title: 'Lazy-load columns', by: 'Ploy S.' },
      { title: 'Build images on GitHub Actions', by: '' },
    ]);
    expect(email.finishedMore).toBe(6);
  });

  it('labels and explains what needs attention', () => {
    const email = digestEmailContent(contents(), BOARD);
    expect(email.attention).toEqual([
      {
        label: 'Stuck',
        tone: 'warning',
        title: 'Realtime presence on cards',
        why: 'Review · has not moved for 7 days',
      },
      {
        label: 'Overdue',
        tone: 'danger',
        title: 'Realtime presence on cards',
        why: 'Review · due 2 days ago',
      },
      {
        label: 'Due soon',
        tone: 'neutral',
        title: 'Realtime presence on cards',
        why: 'Review · due Tuesday, Nov 10',
      },
    ]);
    expect(email.attentionMore).toBe(2);
  });

  it('says so when nothing was finished or something is overdue', () => {
    const email = digestEmailContent(
      contents({ completed: 0, median: null, finished: [], overdue: 2 }),
      BOARD,
    );
    expect(email.subject).toBe('Website Relaunch: nothing finished last week');
    expect(email.tiles[1]).toMatchObject({
      value: 'None',
      unit: '',
      note: 'Nothing finished last week',
    });
    expect(email.tiles[2].note).toBe('2 overdue');
    expect(email.finishedMore).toBe(0);
  });
});

describe('digestIsEmpty', () => {
  it('is empty only when there is nothing at all to report', () => {
    const nothing = contents({
      completed: 0,
      attention: [],
      attentionTotal: 0,
      dueThisWeek: 0,
    });
    expect(digestIsEmpty(nothing)).toBe(true);
    expect(digestIsEmpty({ ...nothing, completed: 1 })).toBe(false);
    expect(digestIsEmpty({ ...nothing, dueThisWeek: 1 })).toBe(false);
    expect(digestIsEmpty({ ...nothing, attention: [attention({})] })).toBe(
      false,
    );
  });
});
