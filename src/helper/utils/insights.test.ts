import { describe, expect, it } from 'vitest';
import {
  attentionWhy,
  compareNote,
  countOf,
  currentWeekKey,
  dayKeyOf,
  digestDueWeek,
  digestSubject,
  digestWeek,
  formatDayKey,
  formatSpan,
  insightsPeriod,
  nextDigestAt,
  shiftDayKey,
  spanParts,
  spanUnitFor,
  timeToDoneChange,
  weekStartOf,
} from './insights';

const BANGKOK = 'Asia/Bangkok';
// Wednesday 11 Nov 2026, noon in Bangkok
const NOW = new Date('2026-11-11T05:00:00Z');

describe('weeks', () => {
  it('start on Monday in the zone', () => {
    expect(dayKeyOf(weekStartOf(NOW, BANGKOK))).toBe('2026-11-09');
    // Sunday evening in UTC is already Monday in Bangkok
    const sundayNight = new Date('2026-11-08T18:00:00Z');
    expect(dayKeyOf(weekStartOf(sundayNight, 'UTC'))).toBe('2026-11-02');
    expect(dayKeyOf(weekStartOf(sundayNight, BANGKOK))).toBe('2026-11-09');
    expect(currentWeekKey(sundayNight, BANGKOK)).toBe('2026-11-09');
  });

  it('a Monday is the start of its own week', () => {
    const monday = new Date('2026-11-09T03:00:00Z');
    expect(dayKeyOf(weekStartOf(monday, BANGKOK))).toBe('2026-11-09');
  });

  it('shift and format day keys, across months and years', () => {
    expect(shiftDayKey('2026-11-02', 6)).toBe('2026-11-08');
    expect(shiftDayKey('2026-01-03', -7)).toBe('2025-12-27');
    expect(formatDayKey('2026-08-24')).toBe('Aug 24');
  });
});

describe('insightsPeriod', () => {
  it('covers whole weeks ending with the current one', () => {
    const period = insightsPeriod(NOW, 4, BANGKOK);
    expect(period.weekKeys).toEqual([
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
    ]);
    // midnight in Bangkok is 17:00 UTC the day before
    expect(period.from.toISOString()).toBe('2026-10-18T17:00:00.000Z');
    expect(period.previousFrom.toISOString()).toBe('2026-09-20T17:00:00.000Z');
    expect(period.today.toISOString()).toBe('2026-11-10T17:00:00.000Z');
    // "Coming up" stops seven days on, at midnight in Bangkok
    expect(period.soon.toISOString()).toBe('2026-11-17T17:00:00.000Z');
  });

  it('gives twelve weeks when asked', () => {
    const period = insightsPeriod(NOW, 12, 'UTC');
    expect(period.weekKeys).toHaveLength(12);
    expect(period.weekKeys[0]).toBe('2026-08-24');
    expect(period.from.toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });
});

describe('the weekly digest', () => {
  it('is due on Monday from 9:00 in the zone, and only then', () => {
    const at = (iso: string) => digestDueWeek(new Date(iso), BANGKOK);
    expect(at('2026-11-09T01:59:00Z')).toBeNull(); // Monday 8:59
    expect(at('2026-11-09T02:00:00Z')).toBe('2026-11-09'); // Monday 9:00
    expect(at('2026-11-09T16:59:00Z')).toBe('2026-11-09'); // Monday 23:59
    expect(at('2026-11-09T17:00:00Z')).toBeNull(); // Tuesday 0:00
    expect(at('2026-11-11T05:00:00Z')).toBeNull(); // Wednesday
  });

  it('next goes out on the coming Monday at 9:00', () => {
    expect(nextDigestAt(NOW, BANGKOK).toISOString()).toBe(
      '2026-11-16T02:00:00.000Z',
    );
    // early on a Monday the next one is today
    expect(
      nextDigestAt(new Date('2026-11-09T00:00:00Z'), BANGKOK).toISOString(),
    ).toBe('2026-11-09T02:00:00.000Z');
    expect(
      nextDigestAt(new Date('2026-11-09T02:00:00Z'), BANGKOK).toISOString(),
    ).toBe('2026-11-16T02:00:00.000Z');
  });

  it('reports on the week before the Monday it is sent', () => {
    const week = digestWeek('2026-11-09', BANGKOK);
    expect(week.from.toISOString()).toBe('2026-11-01T17:00:00.000Z');
    expect(week.to.toISOString()).toBe('2026-11-08T17:00:00.000Z');
    expect(week.previousFrom.toISOString()).toBe('2026-10-25T17:00:00.000Z');
    expect(week.nextWeek.toISOString()).toBe('2026-11-15T17:00:00.000Z');
    expect(week.label).toBe('Nov 2 to Nov 8');
  });

  it('names the board and the count in the subject', () => {
    expect(digestSubject('Website Relaunch', 8)).toBe(
      'Website Relaunch: 8 tasks finished last week',
    );
    expect(digestSubject('Website Relaunch', 1)).toBe(
      'Website Relaunch: 1 task finished last week',
    );
    expect(digestSubject('Website Relaunch', 0)).toBe(
      'Website Relaunch: nothing finished last week',
    );
  });
});

describe('stretches of time', () => {
  it('read in days from a day up, then hours, then minutes', () => {
    expect(spanParts(4.52)).toEqual({ value: '4.5', unit: 'days' });
    expect(spanParts(1)).toEqual({ value: '1.0', unit: 'days' });
    expect(spanParts(0.25)).toEqual({ value: '6.0', unit: 'hours' });
    expect(spanParts(0.01)).toEqual({ value: '14', unit: 'min' });
    expect(spanParts(0.0001)).toEqual({ value: '1', unit: 'min' });
    expect(spanParts(0)).toEqual({ value: '0.0', unit: 'days' });
  });

  it('can be forced into one unit, to compare a list', () => {
    expect(spanUnitFor(1.6)).toBe('days');
    expect(spanUnitFor(0.5)).toBe('hours');
    expect(spanUnitFor(0.01)).toBe('min');
    expect(formatSpan(0.6, 'days')).toBe('0.6');
    expect(formatSpan(0.5, 'hours')).toBe('12.0');
    expect(formatSpan(0, 'min')).toBe('0');
  });
});

describe('notes', () => {
  it('counts with the right plural', () => {
    expect(countOf(1, 'task')).toBe('1 task');
    expect(countOf(3, 'task')).toBe('3 tasks');
  });

  it('compares a total with the stretch before', () => {
    expect(compareNote(61, 52, 'the 12 weeks before')).toBe(
      '9 more than the 12 weeks before',
    );
    expect(compareNote(4, 8, 'the week before')).toBe(
      '4 fewer than the week before',
    );
    expect(compareNote(5, 5, 'the 4 weeks before')).toBe(
      'Same as the 4 weeks before',
    );
  });

  it('says how the median moved', () => {
    expect(timeToDoneChange(4.5, null)).toBeNull();
    expect(timeToDoneChange(4.5, 5.3)).toEqual({
      text: '0.8 days',
      faster: true,
    });
    expect(timeToDoneChange(5, 4.75)).toEqual({
      text: '0.3 days',
      faster: false,
    });
    // a median shown in hours moves in hours
    expect(timeToDoneChange(0.25, 0.5)).toEqual({
      text: '6.0 hours',
      faster: true,
    });
    expect(timeToDoneChange(4.5, 4.5)).toBeNull();
  });

  it('says where a task is and what is wrong with it', () => {
    const item = {
      columnName: 'Review',
      dueDate: null,
      overdueDays: 0,
      idleDays: 0,
      waitingOn: null,
    };
    expect(attentionWhy({ ...item, kind: 'overdue', overdueDays: 1 })).toBe(
      'Review · due yesterday',
    );
    expect(attentionWhy({ ...item, kind: 'overdue', overdueDays: 8 })).toBe(
      'Review · due 8 days ago',
    );
    expect(attentionWhy({ ...item, kind: 'stuck', idleDays: 9 })).toBe(
      'Review · has not moved for 9 days',
    );
    expect(
      attentionWhy({ ...item, kind: 'blocked', waitingOn: 'Set up Resend' }),
    ).toBe('Review · waiting on Set up Resend');
    expect(attentionWhy({ ...item, kind: 'blocked' })).toBe(
      'Review · waiting on another task',
    );
    // 18:00 UTC on Monday is already Tuesday in Bangkok
    const due = {
      ...item,
      kind: 'due_soon',
      dueDate: '2026-11-09T18:00:00Z',
    } as const;
    expect(attentionWhy(due, BANGKOK)).toBe('Review · due Tuesday, Nov 10');
    expect(attentionWhy(due)).toBe('Review · due Monday, Nov 9');
    expect(attentionWhy({ ...item, kind: 'due_soon' })).toBe(
      'Review · due this week',
    );
  });
});
