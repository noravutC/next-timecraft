import { joinNames } from './task-activity-view';
import { addDays, timeZoneCity, zonedDay, zonedTimeToUtc } from './time-zone';

/** Reminders go out at this hour, in the workspace's time zone. */
export const REMINDER_HOUR = 9;

/** The choices under "Remind assignees", in days before the due date. */
export const REMINDER_OPTIONS: { label: string; daysBefore: number | null }[] =
  [
    { label: 'None', daysBefore: null },
    { label: 'On the day', daysBefore: 0 },
    { label: '1 day before', daysBefore: 1 },
    { label: '2 days before', daysBefore: 2 },
    { label: '1 week before', daysBefore: 7 },
  ];

/** 9:00 in the zone, `daysBefore` days before the day the task is due. */
export const reminderInstant = (
  dueDate: Date,
  daysBefore: number,
  tz: string,
): Date =>
  zonedTimeToUtc(
    addDays(zonedDay(dueDate, tz), -daysBefore),
    REMINDER_HOUR,
    tz,
  );

/**
 * Whether a reminder should go out now: on its day, from 9:00. A reminder
 * set for a day that has already ended never goes out.
 */
export const reminderIsDue = (
  dueDate: Date,
  daysBefore: number,
  tz: string,
  now: Date,
): boolean => {
  const day = addDays(zonedDay(dueDate, tz), -daysBefore);
  const endOfDay = zonedTimeToUtc(addDays(day, 1), 0, tz);
  return now >= reminderInstant(dueDate, daysBefore, tz) && now < endOfDay;
};

const dayAndTime = (at: Date, tz: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: tz,
  }).format(at);

/** What the reminder will do, under "Remind assignees". */
export const reminderSummary = (args: {
  dueDate: Date;
  daysBefore: number | null;
  assigneeNames: string[];
  /** the board's workspace zone; null when this screen doesn't know it */
  timeZone: string | null;
  /** when this reminder went out, if it has */
  remindedAt?: Date | string | null;
  now?: Date;
}): string => {
  const { dueDate, daysBefore, assigneeNames } = args;
  const timeZone =
    args.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zoneName = args.timeZone
    ? `${timeZoneCity(args.timeZone)} time`
    : 'in its workspace’s time zone';
  const now = args.now ?? new Date();
  if (daysBefore === null) {
    return 'No reminder. The task keeps its due date on the board.';
  }
  if (args.remindedAt) {
    return `Reminder sent ${dayAndTime(new Date(args.remindedAt), timeZone)}. A new date or reminder sends another.`;
  }
  const at = reminderInstant(dueDate, daysBefore, timeZone);
  if (at < now && !reminderIsDue(dueDate, daysBefore, timeZone, now)) {
    return 'That day has already passed, so no reminder will go out. Pick a later one.';
  }
  if (assigneeNames.length === 0) {
    return 'Nobody is assigned yet, so no one will be reminded.';
  }
  const who = joinNames(assigneeNames);
  const verb = assigneeNames.length === 1 ? 'is' : 'are';
  if (at < now) return `${who} ${verb} reminded in the next few minutes.`;
  return `${who} ${verb} reminded on ${dayAndTime(at, timeZone)} at 9:00 AM, ${zoneName}.`;
};

/** "1 day before" on the due date chip. */
export const reminderShortLabel = (daysBefore: number): string =>
  REMINDER_OPTIONS.find((o) => o.daysBefore === daysBefore)?.label ??
  `${daysBefore} days before`;
