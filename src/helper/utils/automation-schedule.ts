import type { ScheduleTrigger } from '@/types';
import { addDays, zonedDay, zonedTimeToUtc } from './time-zone';

type Day = { year: number; month: number; day: number };

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Monday first, as the day picker shows them. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** The times a schedule can be set to: every half hour. */
export const SCHEDULE_TIMES: string[] = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, '0');
  return `${hour}:${i % 2 === 0 ? '00' : '30'}`;
});

/** Months differ in length: a day every month has. */
export const MAX_MONTH_DAY = 28;

/** "09:00" → "9:00" */
export const formatScheduleTime = (time: string): string =>
  time.replace(/^0/, '');

const weekdayOf = (d: Day): number =>
  new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();

const runsOn = (trigger: ScheduleTrigger, d: Day): boolean => {
  if (trigger.every === 'week') {
    return (trigger.weekdays ?? []).includes(weekdayOf(d));
  }
  if (trigger.every === 'month') return d.day === (trigger.monthDay ?? 1);
  return true;
};

/** That wall-clock time on that day in the zone. */
const at = (d: Day, time: string, tz: string): Date => {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(zonedTimeToUtc(d, hour, tz).getTime() + minute * 60_000);
};

/**
 * The first time after `after` that the schedule comes round, in the
 * workspace's zone. Null for a weekly schedule with no day picked.
 */
export const nextRunAt = (
  trigger: ScheduleTrigger,
  tz: string,
  after: Date,
): Date | null => {
  const today = zonedDay(after, tz);
  // 62 days always holds two month days and every weekday
  for (let i = 0; i <= 62; i += 1) {
    const d = addDays(today, i);
    if (!runsOn(trigger, d)) continue;
    const when = at(d, trigger.time, tz);
    if (when > after) return when;
  }
  return null;
};

/** The next few times, for "Next: Mon, Nov 16 · Mon, Nov 23 · Mon, Nov 30". */
export const upcomingRuns = (
  trigger: ScheduleTrigger,
  tz: string,
  after: Date,
  count: number,
): Date[] => {
  const runs: Date[] = [];
  let from = after;
  while (runs.length < count) {
    const next = nextRunAt(trigger, tz, from);
    if (!next) break;
    runs.push(next);
    from = next;
  }
  return runs;
};

/** "Mon, Nov 16" in the zone. */
export const formatRunDay = (when: Date, tz: string): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).format(when);

/** Noon on the day `days` after `from` in the zone: a due date. */
export const dueDateIn = (days: number, tz: string, from: Date): Date =>
  zonedTimeToUtc(addDays(zonedDay(from, tz), days), 12, tz);
