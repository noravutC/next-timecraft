import { PRIORITY_STYLES } from '@/lib/task-priority';
import type {
  ActivityColumnRef,
  ActivityPersonRef,
  TaskActivityEntry,
  TaskActivityWithActor,
  TaskPriority,
} from '@/types';
import { formatMonthDay, formatRelativePast } from './date-format';
import { shortName } from './person-name';

export type ActivityIcon =
  | 'created'
  | 'moved'
  | 'edited'
  | 'priority'
  | 'due'
  | 'labels'
  | 'estimate'
  | 'archived'
  | 'people'
  | 'subtask';

/** One history row in words: "<actor> <verb> <object> <note>". */
export type ActivityLine = {
  icon: ActivityIcon;
  verb: string;
  /** shown emphasised */
  object?: string;
  /** shown muted, e.g. the old value */
  note?: string;
  /** a move shows both columns as chips */
  from?: ActivityColumnRef | null;
  to?: ActivityColumnRef | null;
  /** a priority change draws the new priority as its icon */
  priority?: TaskPriority;
};

/** 1h, 4h, 1d, 2d, 1w; odd values stay in hours */
export const formatEstimate = (hours: number): string =>
  hours % 40 === 0
    ? `${hours / 40}w`
    : hours % 8 === 0
      ? `${hours / 8}d`
      : `${hours}h`;

/** "A", "A and B", "A, B and C" */
export const joinNames = (names: string[]): string =>
  names.length <= 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

const people = (refs: ActivityPersonRef[]) =>
  joinNames(refs.map((p) => shortName(p.name) || 'someone'));

const priority = (p: string) => PRIORITY_STYLES[p as TaskPriority]?.label ?? p;

const day = (iso: string, now: Date) => formatMonthDay(new Date(iso), now);

const plural = (n: number, word: string) => (n === 1 ? word : `${word}s`);

export function describeActivity(
  entry: TaskActivityEntry,
  now: Date = new Date(),
): ActivityLine {
  switch (entry.type) {
    case 'created':
      return entry.data.column
        ? {
            icon: 'created',
            verb: 'created this task in',
            object: entry.data.column.name,
          }
        : { icon: 'created', verb: 'created this task' };
    case 'moved':
      return {
        icon: 'moved',
        verb: 'moved this from',
        from: entry.data.from,
        to: entry.data.to,
      };
    case 'renamed':
      return {
        icon: 'edited',
        verb: 'renamed this to',
        object: entry.data.to,
        note: `from “${entry.data.from}”`,
      };
    case 'description_changed':
      return { icon: 'edited', verb: 'updated the description' };
    case 'priority_changed':
      return {
        icon: 'priority',
        priority: entry.data.to as TaskPriority,
        verb: 'set priority to',
        object: priority(entry.data.to),
        note: `from ${priority(entry.data.from)}`,
      };
    case 'due_changed': {
      const { from, to } = entry.data;
      if (!to)
        return {
          icon: 'due',
          verb: 'removed the due date',
          note: from ? `was ${day(from, now)}` : undefined,
        };
      if (!from)
        return {
          icon: 'due',
          verb: 'set the due date to',
          object: day(to, now),
        };
      return {
        icon: 'due',
        verb: 'changed the due date to',
        object: day(to, now),
        note: `from ${day(from, now)}`,
      };
    }
    case 'labels_changed': {
      const { added, removed } = entry.data;
      if (added.length && removed.length) {
        return {
          icon: 'labels',
          verb: 'changed labels:',
          object: `added ${added.join(', ')}`,
          note: `removed ${removed.join(', ')}`,
        };
      }
      if (added.length)
        return {
          icon: 'labels',
          verb: `added ${plural(added.length, 'label')}`,
          object: added.join(', '),
        };
      return {
        icon: 'labels',
        verb: `removed ${plural(removed.length, 'label')}`,
        object: removed.join(', '),
      };
    }
    case 'estimate_changed': {
      const { from, to } = entry.data;
      if (!to)
        return {
          icon: 'estimate',
          verb: 'removed the estimate',
          note: from ? `was ${formatEstimate(from)}` : undefined,
        };
      return {
        icon: 'estimate',
        verb: 'set the estimate to',
        object: formatEstimate(to),
        note: from ? `from ${formatEstimate(from)}` : undefined,
      };
    }
    case 'archived':
      return { icon: 'archived', verb: 'archived this task' };
    case 'restored':
      return { icon: 'archived', verb: 'restored this task' };
    case 'assignees_changed': {
      const { added, removed } = entry.data;
      if (added.length && removed.length) {
        return {
          icon: 'people',
          verb: 'assigned',
          object: people(added),
          note: `and unassigned ${people(removed)}`,
        };
      }
      if (added.length)
        return { icon: 'people', verb: 'assigned', object: people(added) };
      return { icon: 'people', verb: 'unassigned', object: people(removed) };
    }
    case 'subtask_completed':
      return { icon: 'subtask', verb: 'completed', object: entry.data.title };
    case 'subtask_reopened':
      return { icon: 'subtask', verb: 'reopened', object: entry.data.title };
  }
}

export type ActivityDay = {
  key: string;
  label: string;
  items: (TaskActivityWithActor & { time: string })[];
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Groups history by local day, in the order given. Today and Yesterday are
 * named, older days read "Nov 3". Today's entries show how long ago they
 * happened, older ones the time of day.
 */
export function groupActivityByDay(
  items: TaskActivityWithActor[],
  now: Date = new Date(),
): ActivityDay[] {
  const days: ActivityDay[] = [];
  const todayKey = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);
  for (const item of items) {
    const at = new Date(item.createdAt);
    const key = dayKey(at);
    let group = days.find((d) => d.key === key);
    if (!group) {
      group = {
        key,
        label:
          key === todayKey
            ? 'Today'
            : key === yesterdayKey
              ? 'Yesterday'
              : formatMonthDay(at, now),
        items: [],
      };
      days.push(group);
    }
    group.items.push({
      ...item,
      time:
        key === todayKey
          ? formatRelativePast(at)
          : at.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
    });
  }
  return days;
}
