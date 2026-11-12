import type { AttentionItem, AttentionKind } from '@/types';
import { addDays, zonedDay, zonedTimeToUtc } from './time-zone';

/** The periods the Insights view can show, in weeks. */
export const INSIGHT_WEEKS = [4, 12] as const;
export type InsightWeeks = (typeof INSIGHT_WEEKS)[number];

/** A task is stuck after this many days without changing column. */
export const STUCK_AFTER_DAYS = 7;

/** "Coming up" lists open tasks due within this many days, today included. */
export const UPCOMING_DAYS = 7;

/** The weekly digest goes out on Monday at this hour, in the workspace's zone. */
export const DIGEST_HOUR = 9;

type Day = { year: number; month: number; day: number };

const pad = (n: number) => String(n).padStart(2, '0');
const asUtc = (d: Day) => Date.UTC(d.year, d.month - 1, d.day);

/** A calendar day as YYYY-MM-DD. */
export const dayKeyOf = (d: Day): string =>
  `${d.year}-${pad(d.month)}-${pad(d.day)}`;

const parseDayKey = (key: string): Day => {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
};

/** The day `days` after a YYYY-MM-DD day (negative for before). */
export const shiftDayKey = (key: string, days: number): string =>
  dayKeyOf(addDays(parseDayKey(key), days));

/** "Aug 24" for a YYYY-MM-DD day. */
export const formatDayKey = (key: string): string =>
  new Date(asUtc(parseDayKey(key))).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** The Monday of the week a moment falls in, in that zone. */
export const weekStartOf = (at: Date, tz: string): Day => {
  const day = zonedDay(at, tz);
  const weekday = new Date(asUtc(day)).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
};

/**
 * The stretch the Insights view covers: `weeks` Monday-to-Sunday weeks
 * ending with the current one, and where the stretch before it starts.
 */
export const insightsPeriod = (now: Date, weeks: number, tz: string) => {
  const first = addDays(weekStartOf(now, tz), -7 * (weeks - 1));
  const today = zonedDay(now, tz);
  return {
    /** each week's Monday, oldest first */
    weekKeys: Array.from({ length: weeks }, (_, i) =>
      dayKeyOf(addDays(first, 7 * i)),
    ),
    from: zonedTimeToUtc(first, 0, tz),
    previousFrom: zonedTimeToUtc(addDays(first, -7 * weeks), 0, tz),
    /** midnight today: a due date before it is overdue */
    today: zonedTimeToUtc(today, 0, tz),
    /** where "Coming up" stops: midnight, UPCOMING_DAYS days from today */
    soon: zonedTimeToUtc(addDays(today, UPCOMING_DAYS), 0, tz),
  };
};

/** The Monday (YYYY-MM-DD) of the week `now` is in. */
export const currentWeekKey = (now: Date, tz: string): string =>
  dayKeyOf(weekStartOf(now, tz));

/**
 * The week whose digest should go out now: on Monday, from 9:00 in the
 * zone. Null at any other time, so a missed Monday is skipped, not sent late.
 */
export const digestDueWeek = (now: Date, tz: string): string | null => {
  const monday = weekStartOf(now, tz);
  if (dayKeyOf(zonedDay(now, tz)) !== dayKeyOf(monday)) return null;
  return now >= zonedTimeToUtc(monday, DIGEST_HOUR, tz)
    ? dayKeyOf(monday)
    : null;
};

/** When the next digest goes out: the coming Monday at 9:00 in the zone. */
export const nextDigestAt = (now: Date, tz: string): Date => {
  const monday = weekStartOf(now, tz);
  const thisWeek = zonedTimeToUtc(monday, DIGEST_HOUR, tz);
  return now < thisWeek
    ? thisWeek
    : zonedTimeToUtc(addDays(monday, 7), DIGEST_HOUR, tz);
};

/**
 * What the digest sent on the Monday `weekKey` reports on: the week before
 * it, the week before that (to compare) and the week now starting.
 */
export const digestWeek = (weekKey: string, tz: string) => {
  const monday = parseDayKey(weekKey);
  const at = (days: number) => zonedTimeToUtc(addDays(monday, days), 0, tz);
  return {
    previousFrom: at(-14),
    from: at(-7),
    to: at(0),
    nextWeek: at(7),
    /** "Nov 2 to Nov 8" */
    label: `${formatDayKey(shiftDayKey(weekKey, -7))} to ${formatDayKey(shiftDayKey(weekKey, -1))}`,
  };
};

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

/** "8 tasks", "1 task" */
export const countOf = (n: number, word: string): string =>
  `${n} ${plural(n, word)}`;

export type SpanUnit = 'days' | 'hours' | 'min';

/** The unit a stretch of days reads best in: days from one day up. */
export const spanUnitFor = (days: number): SpanUnit => {
  if (days >= 1 || days === 0) return 'days';
  return days * 24 >= 1 ? 'hours' : 'min';
};

/** A stretch of days as a number in that unit: "4.5", "13.8", "40". */
export const formatSpan = (days: number, unit: SpanUnit): string => {
  if (unit === 'days') return days.toFixed(1);
  if (unit === 'hours') return (days * 24).toFixed(1);
  return String(Math.round(days * 1440));
};

/** A stretch of time in the unit that reads best for it. */
export const spanParts = (days: number): { value: string; unit: SpanUnit } => {
  const unit = spanUnitFor(days);
  const value = formatSpan(days, unit);
  // anything above nothing is at least a minute
  return { value: unit === 'min' && value === '0' ? '1' : value, unit };
};

/** "9 more than the 12 weeks before" (`before` names the earlier stretch). */
export const compareNote = (
  total: number,
  previous: number,
  before: string,
): string => {
  const diff = total - previous;
  if (diff === 0) return `Same as ${before}`;
  return `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than ${before}`;
};

/**
 * How the median time to finish moved against the stretch before it:
 * "0.8 days" and which way. Null with nothing to compare, or no change.
 */
export const timeToDoneChange = (
  median: number,
  previousMedian: number | null,
): { text: string; faster: boolean } | null => {
  if (previousMedian === null) return null;
  // in the unit the median itself is shown in
  const unit = spanUnitFor(median);
  const change = formatSpan(Math.abs(previousMedian - median), unit);
  if (Number(change) === 0) return null;
  return { text: `${change} ${unit}`, faster: median < previousMedian };
};

export const ATTENTION_LABELS: Record<AttentionKind, string> = {
  overdue: 'Overdue',
  stuck: 'Stuck',
  blocked: 'Blocked',
  due_soon: 'Due soon',
};

/** "Review · has not moved for 9 days": where the task is and what is wrong. */
export const attentionWhy = (
  item: Pick<
    AttentionItem,
    'kind' | 'columnName' | 'dueDate' | 'overdueDays' | 'idleDays' | 'waitingOn'
  >,
  tz = 'UTC',
): string => {
  const reason = {
    overdue: () =>
      item.overdueDays <= 1
        ? 'due yesterday'
        : `due ${item.overdueDays} days ago`,
    stuck: () => `has not moved for ${countOf(item.idleDays, 'day')}`,
    blocked: () => `waiting on ${item.waitingOn ?? 'another task'}`,
    due_soon: () =>
      item.dueDate
        ? `due ${new Date(item.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz })}`
        : 'due this week',
  }[item.kind]();
  return `${item.columnName} · ${reason}`;
};

/** "Website Relaunch: 8 tasks finished last week" */
export const digestSubject = (boardName: string, finished: number): string =>
  finished === 0
    ? `${boardName}: nothing finished last week`
    : `${boardName}: ${countOf(finished, 'task')} finished last week`;
