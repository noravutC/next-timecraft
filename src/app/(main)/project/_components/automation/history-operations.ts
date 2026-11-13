import { webhookEventName } from '@/helper/utils/automation';
import { addDays, zonedDay } from '@/helper/utils/time-zone';
import { deliveryDetail, MAX_WEBHOOK_ATTEMPTS } from '@/helper/utils/webhook';
import type { HistoryItem, RuleTriggerType } from '@/types';

export type HistoryTone = 'good' | 'bad' | 'warn' | 'wait';

/** What went wrong with a message, to show under its row. */
export type HistoryFailure = {
  /** "The receiver answered" */
  lead: string;
  /** "500 Internal Server Error", drawn strong; empty when there was no answer */
  answer: string;
  /** "after 1.2 seconds. This was try 3 of 5. The next one is in 10 minutes." */
  rest: string;
  /** the request as it was sent, for whoever is debugging the receiver */
  request: string;
  payload: string;
};

export type HistoryRowView = {
  id: string;
  kind: 'run' | 'delivery';
  /** "10:42" */
  time: string;
  icon: RuleTriggerType | 'webhook';
  tone: 'change' | 'schedule' | 'hook';
  name: string;
  sub: string;
  task: string;
  taskId: string | null;
  chip: { text: string; tone: HistoryTone };
  detail: string;
  failure: HistoryFailure | null;
};

type Day = { year: number; month: number; day: number };
const sameDay = (a: Day, b: Day) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

const clock = (at: Date, tz: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: tz,
  }).format(at);

const dayName = (at: Date, now: Date, tz: string, long: boolean): string => {
  const day = zonedDay(at, tz);
  const today = zonedDay(now, tz);
  if (sameDay(day, today)) return 'Today';
  if (sameDay(day, addDays(today, -1))) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', {
    weekday: long ? 'long' : 'short',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).format(at);
};

/** "Today, 10:42", "Yesterday, 16:05", "Tue, Nov 10, 11:20" */
export const runWhen = (at: Date, now: Date, tz: string): string =>
  `${dayName(at, now, tz, false)}, ${clock(at, tz)}`;

/** "in 10 minutes", "in 2 hours", "any moment now" */
export const untilText = (at: Date, now: Date): string => {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 1) return 'any moment now';
  if (minutes < 60)
    return `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.round(minutes / 60);
  return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
};

type Delivery = Extract<HistoryItem, { kind: 'delivery' }>;

/** "182 ms", "1.2 seconds" */
const took = (ms: number): string =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} seconds`;

const failureOf = (item: Delivery, now: Date): HistoryFailure | null => {
  if (item.attempts === 0 || item.status === 'sent') return null;
  const answered = item.responseStatus !== null;
  const after =
    answered && item.durationMs !== null
      ? `after ${took(item.durationMs)}. `
      : '';
  const next =
    item.status === 'failed'
      ? `It was tried ${MAX_WEBHOOK_ATTEMPTS} times and will not be sent again by itself.`
      : `This was try ${item.attempts} of ${MAX_WEBHOOK_ATTEMPTS}. The next one is ${untilText(new Date(item.nextAttemptAt), now)}.`;
  return {
    lead: answered ? 'The receiver answered' : 'It did not get through:',
    answer:
      item.error ?? (answered ? String(item.responseStatus) : 'no answer'),
    rest: `${after}${next}`,
    request: [
      `POST ${item.url}`,
      `X-TimeCraft-Event: ${item.event}`,
      `X-TimeCraft-Delivery: ${item.id}`,
    ].join('\n'),
    payload: JSON.stringify(item.payload, null, 2),
  };
};

const RUN_CHIPS = {
  done: { text: 'Done', tone: 'good' },
  needs_fix: { text: 'Needs a fix', tone: 'warn' },
  failed: { text: 'Failed', tone: 'bad' },
} as const;

const rowOf = (item: HistoryItem, now: Date, tz: string): HistoryRowView => {
  const time = clock(new Date(item.createdAt), tz);
  if (item.kind === 'run') {
    return {
      id: item.id,
      kind: 'run',
      time,
      icon: item.trigger,
      tone: item.trigger === 'schedule' ? 'schedule' : 'change',
      name: item.rule,
      sub: item.trigger === 'schedule' ? 'Rule on a schedule' : 'Rule',
      task: item.taskTitle,
      taskId: item.taskId,
      chip: RUN_CHIPS[item.status],
      detail: item.detail,
      failure: null,
    };
  }
  const waiting = item.attempts === 0;
  return {
    id: item.id,
    kind: 'delivery',
    time,
    icon: 'webhook',
    tone: 'hook',
    name: item.webhookName,
    sub: `Webhook · ${webhookEventName(item.event)}`,
    task: item.taskTitle,
    taskId: item.taskId,
    chip:
      item.status === 'sent'
        ? { text: 'Sent', tone: 'good' }
        : waiting
          ? { text: 'Waiting', tone: 'wait' }
          : { text: 'Failed', tone: 'bad' },
    detail: deliveryDetail(item),
    failure: failureOf(item, now),
  };
};

/** History in days, newest first: "Today", "Yesterday", "Monday, Nov 9". */
export const historyDays = (
  items: HistoryItem[],
  now: Date,
  tz: string,
): { day: string; rows: HistoryRowView[] }[] => {
  const days: { day: string; rows: HistoryRowView[] }[] = [];
  for (const item of items) {
    const day = dayName(new Date(item.createdAt), now, tz, true);
    const last = days[days.length - 1];
    if (last?.day === day) last.rows.push(rowOf(item, now, tz));
    else days.push({ day, rows: [rowOf(item, now, tz)] });
  }
  return days;
};

/** The last few runs of one rule, for the bottom of its editor. */
export const recentRuns = (
  items: HistoryItem[],
  now: Date,
  tz: string,
): { id: string; ok: boolean; text: string; when: string }[] =>
  items
    .flatMap((item) => (item.kind === 'run' ? [item] : []))
    .slice(0, 3)
    .map((run) => ({
      id: run.id,
      ok: run.status === 'done',
      text: run.status === 'done' ? run.taskTitle || run.detail : run.detail,
      when: runWhen(new Date(run.createdAt), now, tz),
    }));
