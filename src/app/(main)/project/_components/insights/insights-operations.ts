import {
  ATTENTION_LABELS,
  attentionWhy,
  countOf,
  formatDayKey,
  formatSpan,
  shiftDayKey,
  spanParts,
  spanUnitFor,
  timeToDoneChange,
  type InsightWeeks,
} from '@/helper/utils/insights';
import { shortName } from '@/helper/utils/person-name';
import type {
  AttentionItem,
  BoardInsights,
  DigestState,
  InsightsPerson,
  InsightsWait,
  InsightsWorkload,
} from '@/types';

type Weeks = BoardInsights['completed']['byWeek'];

/** The period choices, as the segmented control's string values. */
export const PERIOD_OPTIONS: { value: `${InsightWeeks}`; label: string }[] = [
  { value: '4', label: '4 weeks' },
  { value: '12', label: '12 weeks' },
];

export const WEEKS_OF: Record<`${InsightWeeks}`, InsightWeeks> = {
  '4': 4,
  '12': 12,
};

/** "Aug 24 to today": the stretch the numbers cover. */
export const periodText = (byWeek: Weeks): string =>
  byWeek.length ? `${formatDayKey(byWeek[0].start)} to today` : '';

/**
 * The top of the chart's y axis: the smallest of 4, 8, 10, 20, 40, 80, 100…
 * that fits the tallest bar, so the middle gridline is a whole number too.
 */
export const chartMax = (peak: number): number => {
  for (let unit = 1; ; unit *= 10) {
    const fit = [4, 8, 10, 20].find((step) => peak <= step * unit);
    if (fit) return fit * unit;
  }
};

export type ChartBar = {
  key: string;
  /** under the bars: the week's Monday, or "This week" */
  label: string;
  finished: number;
  created: number;
  /** bar heights, as shares of the axis */
  finishedPercent: number;
  createdPercent: number;
  /** the taller of the two: the tooltip sits above it */
  peakPercent: number;
  /** the week still running: drawn lighter */
  partial: boolean;
  /** the tooltip's heading: "Nov 2 to Nov 8" */
  span: string;
  /** the pair read out: "Nov 2 to Nov 8: 8 finished, 6 new" */
  summary: string;
  /** in a narrow chart only some labels fit: this one stays */
  labelWhenNarrow: boolean;
  /** the first and last pair: in a narrow chart the tooltip hugs that side */
  edge: 'start' | 'end' | null;
};

/** Up to this many weeks, every label fits under its bars in a narrow chart. */
const ROOMY_BARS = 6;

/** Under the chart: whether more work came in than went out. */
export const flowNote = (
  created: number,
  finished: number,
  weeks: number,
): string => {
  const span = `these ${weeks} weeks`;
  if (created === 0 && finished === 0) {
    return `No tasks were added or finished in ${span}.`;
  }
  const split = `${created} new, ${finished} finished`;
  if (created === finished) {
    return `As many tasks were finished as added in ${span}: ${split}.`;
  }
  const gap = Math.abs(created - finished);
  const [more, less] =
    created > finished ? ['added', 'finished'] : ['finished', 'added'];
  return `${countOf(gap, 'more task')} ${gap === 1 ? 'was' : 'were'} ${more} than ${less} in ${span}: ${split}.`;
};

/**
 * The chart: a pair of bars per week (finished and new), its gridlines,
 * the average finished a week and the line under it.
 */
export const tasksChart = (finished: Weeks, created: Weeks) => {
  const added = new Map(created.map((week) => [week.start, week.count]));
  const weeks = finished.map((week) => ({
    start: week.start,
    finished: week.count,
    created: added.get(week.start) ?? 0,
  }));
  const max = chartMax(
    Math.max(0, ...weeks.flatMap((w) => [w.finished, w.created])),
  );
  const total = {
    finished: weeks.reduce((sum, w) => sum + w.finished, 0),
    created: weeks.reduce((sum, w) => sum + w.created, 0),
  };
  const last = weeks.length - 1;
  const bars: ChartBar[] = weeks.map((week, i) => {
    const partial = i === last;
    const from = formatDayKey(week.start);
    const span = partial
      ? `${from} to today`
      : `${from} to ${formatDayKey(shiftDayKey(week.start, 6))}`;
    return {
      key: week.start,
      label: partial ? 'This week' : from,
      finished: week.finished,
      created: week.created,
      finishedPercent: (week.finished / max) * 100,
      createdPercent: (week.created / max) * 100,
      peakPercent: (Math.max(week.finished, week.created) / max) * 100,
      partial,
      span,
      summary: `${span}: ${week.finished} finished, ${week.created} new${partial ? ' so far' : ''}`,
      // every third, counted back from the current week
      labelWhenNarrow: weeks.length <= ROOMY_BARS || (last - i) % 3 === 0,
      edge: partial ? 'end' : i === 0 ? 'start' : null,
    };
  });
  return {
    bars,
    ticks: [0, max / 2, max].map((value) => ({
      value,
      percent: (value / max) * 100,
    })),
    average: (weeks.length ? total.finished / weeks.length : 0).toFixed(1),
    note: flowNote(total.created, total.finished, weeks.length),
  };
};

/** The banner's sentence: this week's flow, then what is in trouble now. */
export const weekSummary = (data: BoardInsights): string => {
  const finished = data.completed.byWeek.at(-1)?.count ?? 0;
  const created = data.created.byWeek.at(-1)?.count ?? 0;
  const { overdue, stuck } = data;
  const flow = () => {
    if (finished && created) {
      return `${countOf(finished, 'task')} finished and ${created} new.`;
    }
    if (finished) return `${countOf(finished, 'task')} finished, none new.`;
    if (created)
      return `Nothing finished yet, ${countOf(created, 'new task')}.`;
    return 'Nothing finished or added yet.';
  };
  // stuck = STUCK_AFTER_DAYS without changing column
  const idle = 'not moved for over a week';
  const trouble = () => {
    const late = `${countOf(overdue, 'task')} ${overdue === 1 ? 'is' : 'are'} overdue`;
    const has = stuck === 1 ? 'has' : 'have';
    if (overdue && stuck) return `${late} and ${stuck} ${has} ${idle}.`;
    if (overdue) return `${late}.`;
    if (stuck) return `${countOf(stuck, 'task')} ${has} ${idle}.`;
    return 'Nothing is overdue or stuck.';
  };
  return `${flow()} ${trouble()}`;
};

export type TileKey = 'finished' | 'time' | 'onTime' | 'open' | 'overdue';

/** How a number moved against the stretch before: "9 more", up, and good. */
export type TileChip = { text: string; arrow: 'up' | 'down'; good: boolean };

export type InsightTile = {
  key: TileKey;
  label: string;
  value: string;
  unit: string;
  note: string;
  chip?: TileChip;
  /** a ring filled to this share, 0 to 100 */
  ring?: number;
  /** something is late: the tile's mark turns red */
  alert?: boolean;
};

export type TileGroup = { caption: string; tiles: InsightTile[] };

/**
 * The numbers across the top, in two groups: what the chosen period adds
 * up to, and how the board stands right now.
 */
export const tileGroups = (data: BoardInsights): TileGroup[] => {
  const { completed, timeToDone, onTime, weeks, hasFinished } = data;
  const tasks = (n: number) => (n === 1 ? 'task' : 'tasks');
  const none = hasFinished ? 'None' : 'None yet';
  const nothing = hasFinished
    ? `Nothing finished in the last ${weeks} weeks`
    : 'Shown after the first finished task';

  const finished = (): InsightTile => {
    const diff = completed.total - completed.previous;
    const base = {
      key: 'finished' as const,
      label: 'Finished',
      value: String(completed.total),
      unit: tasks(completed.total),
    };
    if (!hasFinished) return { ...base, note: 'Nothing finished yet' };
    if (diff === 0) {
      return { ...base, note: `Same as the ${weeks} weeks before` };
    }
    return {
      ...base,
      note: `than the ${weeks} weeks before`,
      chip: {
        text: `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'}`,
        arrow: diff > 0 ? 'up' : 'down',
        good: diff > 0,
      },
    };
  };

  const time = (): InsightTile => {
    const base = { key: 'time' as const, label: 'Time to finish' };
    const { median, previousMedian } = timeToDone;
    if (median === null)
      return { ...base, value: none, unit: '', note: nothing };
    const change = timeToDoneChange(median, previousMedian);
    const taken = { ...base, ...spanParts(median) };
    if (!change) {
      return {
        ...taken,
        note:
          previousMedian === null
            ? 'For a typical task'
            : 'For a typical task, same as before',
      };
    }
    return {
      ...taken,
      note: 'for a typical task',
      chip: {
        text: `${change.text} ${change.faster ? 'faster' : 'slower'}`,
        arrow: change.faster ? 'down' : 'up',
        good: change.faster,
      },
    };
  };

  const kept = (): InsightTile => {
    const base = { key: 'onTime' as const, label: 'On time' };
    if (onTime.due === 0) {
      return {
        ...base,
        value: none,
        unit: '',
        note: completed.total ? 'No finished task had a due date' : nothing,
      };
    }
    const percent = Math.round((onTime.met / onTime.due) * 100);
    return {
      ...base,
      value: String(percent),
      unit: '%',
      note: `${onTime.met} of ${countOf(onTime.due, 'task')} with a due date`,
      ring: percent,
    };
  };

  return [
    {
      caption: `In the last ${weeks} weeks`,
      tiles: [finished(), time(), kept()],
    },
    {
      caption: 'Right now',
      tiles: [
        {
          key: 'open',
          label: 'Open',
          value: String(data.open),
          unit: tasks(data.open),
          note: 'Not finished yet',
        },
        {
          key: 'overdue',
          label: 'Overdue',
          value: String(data.overdue),
          unit: tasks(data.overdue),
          note: data.overdue ? 'Due date has passed' : 'Nothing is late',
          alert: data.overdue > 0,
        },
      ],
    },
  ];
};

/** The column finished tasks sat in longest; null when no time was spent. */
const slowestOf = (waits: InsightsWait[]): InsightsWait | null =>
  waits.reduce<InsightsWait | null>(
    (top, w) => (w.days > (top?.days ?? 0) ? w : top),
    null,
  );

/**
 * Each column's average wait, with a bar scaled to the longest one. Every
 * row is in the unit that suits the longest, so the numbers compare.
 */
export const waitRows = (waits: InsightsWait[]) => {
  const slowest = slowestOf(waits);
  const longest = slowest?.days ?? 0;
  const unit = spanUnitFor(longest);
  return waits.map((w) => ({
    ...w,
    value: formatSpan(w.days, unit),
    unit,
    percent: longest ? (w.days / longest) * 100 : 0,
    slowest: w.id === slowest?.id,
  }));
};

/** Under the waits: which column holds tasks longest, or why there's none. */
export const waitNote = (
  waits: InsightsWait[],
  tasks: number,
  weeks: number,
): string => {
  const slowest = slowestOf(waits);
  if (!tasks || !slowest) {
    return `No moves between columns were recorded for the tasks finished in these ${weeks} weeks.`;
  }
  return `Tasks wait the longest in ${slowest.name}. Based on ${countOf(tasks, 'task')} finished in these ${weeks} weeks.`;
};

/** Who a listed task belongs to: the first assignee, and everyone's name. */
const ownersOf = (item: AttentionItem) => ({
  owner: item.assignees[0] ?? null,
  ownerNames: item.assignees.map((a) => a.fullName).join(', ') || 'Unassigned',
});

/** One "Needs attention" row: its chip, the two lines and who has it. */
export const attentionRows = (items: AttentionItem[]) =>
  items.map((item) => ({
    id: item.id,
    kind: item.kind,
    label: ATTENTION_LABELS[item.kind],
    title: item.title,
    why: attentionWhy(item),
    ...ownersOf(item),
  }));

/** "due today", "due tomorrow", "due in 3 days" */
export const dueInText = (days: number): string => {
  if (days <= 0) return 'due today';
  return days === 1 ? 'due tomorrow' : `due in ${days} days`;
};

/** One "Coming up" row: the due day as a small calendar leaf, and the rest. */
export const upcomingRows = (items: AttentionItem[], tz: string) =>
  items.map((item) => {
    const due = item.dueDate ? new Date(item.dueDate) : null;
    const part = (options: Intl.DateTimeFormatOptions) =>
      due?.toLocaleDateString('en-US', { ...options, timeZone: tz }) ?? '';
    return {
      id: item.id,
      title: item.title,
      weekday: part({ weekday: 'short' }),
      day: part({ day: 'numeric' }),
      why: `${item.columnName} · ${dueInText(item.dueInDays)}`,
      ...ownersOf(item),
    };
  });

export type WorkloadRow = {
  key: string;
  person: InsightsPerson | null;
  name: string;
  open: number;
  overdue: number;
  /** the bar's two parts, as shares of the busiest person's open tasks */
  latePercent: number;
  restPercent: number;
  /** "21 finished"; blank for unassigned: finished work has an owner */
  done: string;
};

export const workloadRows = (workload: InsightsWorkload[]): WorkloadRow[] => {
  const busiest = Math.max(0, ...workload.map((w) => w.open));
  const share = (n: number) => (busiest ? (n / busiest) * 100 : 0);
  return workload.map((w) => ({
    key: w.person?.id ?? 'unassigned',
    person: w.person,
    name: w.person ? shortName(w.person.fullName) : 'Unassigned',
    open: w.open,
    overdue: w.overdue,
    latePercent: share(w.overdue),
    restPercent: share(w.open - w.overdue),
    done: w.person ? `${w.done} finished` : '',
  }));
};

/** The line under the digest switch: what will happen next. */
export const digestStatusLine = (
  state: DigestState | null,
  isGuest: boolean,
): string => {
  if (isGuest) return 'The guest demo has no inbox. Sign in with Google.';
  if (!state?.on) return 'No emails will be sent';
  if (state.emailOff) return 'Emails are turned off in your settings';
  const next = new Date(state.nextAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return `Next one: ${next}`;
};

/** "and 3 more" under a list that shows only the first rows. */
export const moreLine = (total: number, shown: number): string | null =>
  total > shown ? `and ${countOf(total - shown, 'more task')}` : null;
