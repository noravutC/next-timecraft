import { describe, expect, it } from 'vitest';
import {
  dueDateIn,
  formatRunDay,
  formatScheduleTime,
  nextRunAt,
  SCHEDULE_TIMES,
  upcomingRuns,
} from './automation-schedule';

const BKK = 'Asia/Bangkok';
// Thursday Nov 12, 2026, 10:00 in Bangkok
const now = new Date('2026-11-12T03:00:00Z');

describe('when a schedule comes round', () => {
  it('weekly: the next picked weekday at that time in the zone', () => {
    const next = nextRunAt(
      { type: 'schedule', every: 'week', weekdays: [1], time: '09:00' },
      BKK,
      now,
    );
    // Monday Nov 16, 9:00 Bangkok = 02:00 UTC
    expect(next?.toISOString()).toBe('2026-11-16T02:00:00.000Z');
  });

  it('today counts only while its time is still ahead', () => {
    const daily = { type: 'schedule', every: 'day', time: '09:00' } as const;
    // 10:00 has passed 9:00: tomorrow
    expect(nextRunAt(daily, BKK, now)?.toISOString()).toBe(
      '2026-11-13T02:00:00.000Z',
    );
    expect(
      nextRunAt({ ...daily, time: '10:30' }, BKK, now)?.toISOString(),
    ).toBe('2026-11-12T03:30:00.000Z');
  });

  it('monthly: that day of the month', () => {
    const next = nextRunAt(
      { type: 'schedule', every: 'month', monthDay: 1, time: '09:00' },
      BKK,
      now,
    );
    expect(next?.toISOString()).toBe('2026-12-01T02:00:00.000Z');
  });

  it('follows the zone, not UTC', () => {
    // 22:00 on Sunday in New York is already Monday in UTC
    const next = nextRunAt(
      { type: 'schedule', every: 'week', weekdays: [0], time: '22:00' },
      'America/New_York',
      new Date('2026-11-12T03:00:00Z'),
    );
    expect(next?.toISOString()).toBe('2026-11-16T03:00:00.000Z');
  });

  it('is null when no weekday is picked', () => {
    expect(
      nextRunAt(
        { type: 'schedule', every: 'week', weekdays: [], time: '09:00' },
        BKK,
        now,
      ),
    ).toBeNull();
  });

  it('lists the next few, each after the one before', () => {
    const runs = upcomingRuns(
      { type: 'schedule', every: 'week', weekdays: [1], time: '09:00' },
      BKK,
      now,
      3,
    );
    expect(runs.map((r) => formatRunDay(r, BKK))).toEqual([
      'Mon, Nov 16',
      'Mon, Nov 23',
      'Mon, Nov 30',
    ]);
  });
});

describe('schedule times and due dates', () => {
  it('offers every half hour, written without a leading zero', () => {
    expect(SCHEDULE_TIMES).toHaveLength(48);
    expect(SCHEDULE_TIMES[0]).toBe('00:00');
    expect(SCHEDULE_TIMES[19]).toBe('09:30');
    expect(formatScheduleTime('09:00')).toBe('9:00');
    expect(formatScheduleTime('14:30')).toBe('14:30');
  });

  it('a due date is noon of that day in the zone', () => {
    // 2 days after Nov 12 in Bangkok: Nov 14, 12:00 = 05:00 UTC
    expect(dueDateIn(2, BKK, now).toISOString()).toBe(
      '2026-11-14T05:00:00.000Z',
    );
    expect(dueDateIn(0, BKK, now).toISOString()).toBe(
      '2026-11-12T05:00:00.000Z',
    );
  });
});
