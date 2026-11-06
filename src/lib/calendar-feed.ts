import { appUrl } from '@/lib/app-url';
import { boardUrl } from '@/helper/utils/board-url';
import type { IcalEvent } from '@/helper/utils/ical';
import { zonedDay } from '@/helper/utils/time-zone';

export const calendarFeedUrl = (token: string) => `${appUrl()}/cal/${token}`;

// tokens are 24 random bytes, base64url
export const isFeedToken = (value: string) => /^[A-Za-z0-9_-]{32}$/.test(value);

/** A board's dated tasks as all-day events, on their day in its time zone. */
export const feedEvents = (args: {
  projectId: string;
  timeZone: string;
  tasks: { id: string; title: string; dueDate: Date; columnName: string }[];
}): IcalEvent[] =>
  args.tasks.map((task) => ({
    uid: `${task.id}@timecraft`,
    date: zonedDay(task.dueDate, args.timeZone),
    summary: task.title,
    description: task.columnName,
    url: `${appUrl()}${boardUrl({ board: args.projectId, task: task.id })}`,
  }));
