import type {
  TaskActivityEntry,
  TaskRow,
  WebhookEvent,
  WebhookPayload,
} from '@/types';
import { boardUrl } from './board-url';
import { describeActivity } from './task-activity-view';

/** A message is tried this many times in all, then given up on. */
export const MAX_WEBHOOK_ATTEMPTS = 5;

// minutes to wait after the 1st, 2nd, 3rd and 4th try: about half a day
const RETRY_AFTER_MINUTES = [1, 10, 60, 720];

/**
 * When to try again after `attempts` tries; null once it has been tried
 * as often as it will be.
 */
export const nextAttemptAt = (attempts: number, now: Date): Date | null =>
  attempts >= MAX_WEBHOOK_ATTEMPTS
    ? null
    : new Date(
        now.getTime() + (RETRY_AFTER_MINUTES[attempts - 1] ?? 720) * 60_000,
      );

/** A receiver's answer counts as accepted when it is a 2xx. */
export const isAccepted = (status: number | null): boolean =>
  status !== null && status >= 200 && status < 300;

/**
 * What is wrong with an address typed for a webhook; null when it can be
 * saved. Where it really leads is checked again every time it is sent.
 */
export const webhookUrlProblem = (
  value: string,
  allowInsecure = false,
): string | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'That is not a web address';
  }
  if (
    url.protocol !== 'https:' &&
    !(allowInsecure && url.protocol === 'http:')
  ) {
    return 'The address must start with https://';
  }
  if (url.username || url.password) {
    return 'Leave the user name and password out of the address';
  }
  return null;
};

/** "moved this from In progress to Review": a change in the history's words. */
export const changeText = (entry: TaskActivityEntry, now: Date): string => {
  const line = describeActivity(entry, now);
  const columns =
    entry.type === 'moved'
      ? `${line.from?.name ?? 'a deleted column'} to ${line.to?.name ?? 'a deleted column'}`
      : '';
  return [line.verb, columns, line.object, line.note].filter(Boolean).join(' ');
};

/** What one webhook is sent about one task. */
export const taskPayload = (args: {
  event: WebhookEvent;
  board: { id: string; name: string };
  task: Pick<TaskRow, 'id' | 'title' | 'priority' | 'dueDate' | 'tags'>;
  columnName: string | null;
  change: string;
  actorName: string | null;
  baseUrl: string;
  now: Date;
}): WebhookPayload => ({
  event: args.event,
  sentAt: args.now.toISOString(),
  board: args.board,
  task: {
    id: args.task.id,
    title: args.task.title,
    column: args.columnName,
    priority: args.task.priority,
    dueDate: args.task.dueDate?.toISOString() ?? null,
    labels: args.task.tags,
    url: `${args.baseUrl}${boardUrl({ board: args.board.id, task: args.task.id })}`,
  },
  change: args.change,
  actor: args.actorName ? { name: args.actorName } : null,
});

/** What "Send a test" sends: no task, only a hello. */
export const pingPayload = (
  board: { id: string; name: string },
  now: Date,
): WebhookPayload => ({ event: 'ping', sentAt: now.toISOString(), board });

/** "500 · try 3 of 5", "200 in 182 ms", "No answer · try 1 of 5" */
export const deliveryDetail = (delivery: {
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  responseStatus: number | null;
  durationMs: number | null;
  error: string | null;
}): string => {
  if (delivery.attempts === 0) return 'Waiting to be sent';
  if (delivery.status === 'sent') {
    return `${delivery.responseStatus ?? 200} in ${delivery.durationMs ?? 0} ms`;
  }
  const answer = delivery.responseStatus ?? delivery.error ?? 'No answer';
  return `${answer} · try ${delivery.attempts} of ${MAX_WEBHOOK_ATTEMPTS}`;
};
