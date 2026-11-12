import { describe, expect, it } from 'vitest';
import type { AttentionItem, BoardInsights } from '@/types';
import {
  attentionRows,
  chartMax,
  digestStatusLine,
  dueInText,
  flowNote,
  moreLine,
  periodText,
  tasksChart,
  tileGroups,
  upcomingRows,
  waitNote,
  waitRows,
  weekSummary,
  workloadRows,
} from './insights-operations';

const WEEKS = [
  { start: '2026-10-19', count: 6 },
  { start: '2026-10-26', count: 4 },
  { start: '2026-11-02', count: 8 },
  { start: '2026-11-09', count: 5 },
];
const NEW = [
  { start: '2026-10-19', count: 6 },
  { start: '2026-10-26', count: 6 },
  { start: '2026-11-02', count: 6 },
  { start: '2026-11-09', count: 3 },
];

const insights = (over: Partial<BoardInsights> = {}): BoardInsights => ({
  weeks: 4,
  hasDoneColumn: true,
  hasFinished: true,
  completed: { total: 23, previous: 20, byWeek: WEEKS },
  created: { total: 21, byWeek: NEW },
  timeToDone: { median: 4.1, previousMedian: 4.5 },
  onTime: { due: 10, met: 9 },
  open: 11,
  overdue: 1,
  stuck: 2,
  waits: [],
  waitTasks: 0,
  attention: [],
  attentionTotal: 0,
  upcoming: [],
  upcomingTotal: 0,
  workload: [],
  ...over,
});

const column = (name: string, days: number) => ({
  id: name,
  name,
  color: '#000000',
  days,
});

describe('the chart', () => {
  it('tops its axis at a round number with a whole middle gridline', () => {
    expect(chartMax(0)).toBe(4);
    expect(chartMax(4)).toBe(4);
    expect(chartMax(5)).toBe(8);
    expect(chartMax(9)).toBe(10);
    expect(chartMax(11)).toBe(20);
    expect(chartMax(21)).toBe(40);
    expect(chartMax(81)).toBe(100);
    expect(chartMax(101)).toBe(200);
  });

  it('draws a pair of bars per week, the current one marked as still running', () => {
    const { bars, ticks, average, note } = tasksChart(WEEKS, NEW);
    expect(ticks).toEqual([
      { value: 0, percent: 0 },
      { value: 4, percent: 50 },
      { value: 8, percent: 100 },
    ]);
    expect(bars[0]).toMatchObject({
      label: 'Oct 19',
      finished: 6,
      created: 6,
      finishedPercent: 75,
      createdPercent: 75,
      peakPercent: 75,
      partial: false,
      span: 'Oct 19 to Oct 25',
      summary: 'Oct 19 to Oct 25: 6 finished, 6 new',
      edge: 'start',
    });
    expect(bars[1]).toMatchObject({ peakPercent: 75, edge: null });
    expect(bars[3]).toMatchObject({
      label: 'This week',
      partial: true,
      span: 'Nov 9 to today',
      summary: 'Nov 9 to today: 5 finished, 3 new so far',
      edge: 'end',
    });
    expect(average).toBe('5.8');
    expect(note).toBe(
      '2 more tasks were finished than added in these 4 weeks: 21 new, 23 finished.',
    );
  });

  it('scales to the taller series and treats a missing week as none', () => {
    const { bars, ticks } = tasksChart(WEEKS.slice(0, 2), [
      { start: '2026-10-19', count: 12 },
    ]);
    expect(ticks.at(-1)).toEqual({ value: 20, percent: 100 });
    expect(bars[0]).toMatchObject({ createdPercent: 60, peakPercent: 60 });
    expect(bars[1]).toMatchObject({ created: 0, createdPercent: 0 });
  });

  it('keeps every label for a few weeks, every third for many', () => {
    expect(tasksChart(WEEKS, NEW).bars.every((b) => b.labelWhenNarrow)).toBe(
      true,
    );
    const twelve = Array.from({ length: 12 }, (_, i) => ({
      start: `2026-01-${String(i + 1).padStart(2, '0')}`,
      count: 1,
    }));
    expect(
      tasksChart(twelve, twelve)
        .bars.map((b, i) => (b.labelWhenNarrow ? i : null))
        .filter((i) => i !== null),
    ).toEqual([2, 5, 8, 11]);
  });

  it('copes with no weeks at all', () => {
    expect(tasksChart([], []).average).toBe('0.0');
    expect(periodText([])).toBe('');
    expect(periodText(WEEKS)).toBe('Oct 19 to today');
  });

  it('says whether more work came in than went out', () => {
    expect(flowNote(67, 61, 12)).toBe(
      '6 more tasks were added than finished in these 12 weeks: 67 new, 61 finished.',
    );
    expect(flowNote(5, 4, 4)).toBe(
      '1 more task was added than finished in these 4 weeks: 5 new, 4 finished.',
    );
    expect(flowNote(7, 7, 4)).toBe(
      'As many tasks were finished as added in these 4 weeks: 7 new, 7 finished.',
    );
    expect(flowNote(0, 0, 12)).toBe(
      'No tasks were added or finished in these 12 weeks.',
    );
  });
});

describe('weekSummary', () => {
  const week = (finished: number, created: number) => ({
    completed: {
      total: finished,
      previous: 0,
      byWeek: [{ start: '2026-11-09', count: finished }],
    },
    created: {
      total: created,
      byWeek: [{ start: '2026-11-09', count: created }],
    },
  });

  it('tells the week so far, then what is in trouble', () => {
    expect(weekSummary(insights())).toBe(
      '5 tasks finished and 3 new. 1 task is overdue and 2 have not moved for over a week.',
    );
    expect(weekSummary(insights({ ...week(1, 0), overdue: 3, stuck: 0 }))).toBe(
      '1 task finished, none new. 3 tasks are overdue.',
    );
    expect(weekSummary(insights({ ...week(0, 1), overdue: 0, stuck: 1 }))).toBe(
      'Nothing finished yet, 1 new task. 1 task has not moved for over a week.',
    );
    expect(weekSummary(insights({ ...week(0, 0), overdue: 2, stuck: 1 }))).toBe(
      'Nothing finished or added yet. 2 tasks are overdue and 1 has not moved for over a week.',
    );
    expect(weekSummary(insights({ ...week(2, 2), overdue: 0, stuck: 0 }))).toBe(
      '2 tasks finished and 2 new. Nothing is overdue or stuck.',
    );
  });
});

describe('tileGroups', () => {
  it('groups the period numbers apart from how the board stands now', () => {
    expect(tileGroups(insights())).toEqual([
      {
        caption: 'In the last 4 weeks',
        tiles: [
          {
            key: 'finished',
            label: 'Finished',
            value: '23',
            unit: 'tasks',
            note: 'than the 4 weeks before',
            chip: { text: '3 more', arrow: 'up', good: true },
          },
          {
            key: 'time',
            label: 'Time to finish',
            value: '4.1',
            unit: 'days',
            note: 'for a typical task',
            chip: { text: '0.4 days faster', arrow: 'down', good: true },
          },
          {
            key: 'onTime',
            label: 'On time',
            value: '90',
            unit: '%',
            note: '9 of 10 tasks with a due date',
            ring: 90,
          },
        ],
      },
      {
        caption: 'Right now',
        tiles: [
          {
            key: 'open',
            label: 'Open',
            value: '11',
            unit: 'tasks',
            note: 'Not finished yet',
          },
          {
            key: 'overdue',
            label: 'Overdue',
            value: '1',
            unit: 'task',
            note: 'Due date has passed',
            alert: true,
          },
        ],
      },
    ]);
  });

  it('marks a slower, smaller period without calling it good', () => {
    const [period, now] = tileGroups(
      insights({
        completed: { total: 18, previous: 20, byWeek: WEEKS },
        timeToDone: { median: 5, previousMedian: 4 },
        onTime: { due: 1, met: 0 },
        overdue: 0,
      }),
    );
    expect(period.tiles[0].chip).toEqual({
      text: '2 fewer',
      arrow: 'down',
      good: false,
    });
    expect(period.tiles[1].chip).toEqual({
      text: '1.0 days slower',
      arrow: 'up',
      good: false,
    });
    expect(period.tiles[2]).toMatchObject({
      value: '0',
      note: '0 of 1 task with a due date',
      ring: 0,
    });
    expect(now.tiles[1]).toMatchObject({
      note: 'Nothing is late',
      alert: false,
    });
  });

  it('has no chip when nothing moved or there is nothing to compare', () => {
    const same = tileGroups(
      insights({
        completed: { total: 20, previous: 20, byWeek: WEEKS },
        timeToDone: { median: 4.5, previousMedian: 4.5 },
        onTime: { due: 0, met: 0 },
      }),
    )[0].tiles;
    expect(same[0]).toMatchObject({ note: 'Same as the 4 weeks before' });
    expect(same[0].chip).toBeUndefined();
    expect(same[1]).toMatchObject({
      note: 'For a typical task, same as before',
    });
    expect(same[1].chip).toBeUndefined();
    expect(same[2]).toMatchObject({
      value: 'None',
      unit: '',
      note: 'No finished task had a due date',
    });
    expect(same[2].ring).toBeUndefined();

    const first = tileGroups(
      insights({ timeToDone: { median: 4.5, previousMedian: null } }),
    )[0].tiles;
    expect(first[1]).toMatchObject({ note: 'For a typical task' });
  });

  it('says so when the period has nothing finished', () => {
    const tiles = tileGroups(
      insights({
        completed: { total: 0, previous: 2, byWeek: WEEKS },
        timeToDone: { median: null, previousMedian: 3 },
        onTime: { due: 0, met: 0 },
      }),
    )[0].tiles;
    expect(tiles[0]).toMatchObject({
      note: 'than the 4 weeks before',
      chip: { text: '2 fewer', arrow: 'down', good: false },
    });
    expect(tiles[1]).toMatchObject({
      value: 'None',
      unit: '',
      note: 'Nothing finished in the last 4 weeks',
    });
    expect(tiles[2]).toMatchObject({
      value: 'None',
      note: 'Nothing finished in the last 4 weeks',
    });
  });

  it('waits for the first finished task on a new board', () => {
    const [period] = tileGroups(
      insights({
        weeks: 12,
        hasFinished: false,
        completed: { total: 0, previous: 0, byWeek: [] },
        timeToDone: { median: null, previousMedian: null },
        onTime: { due: 0, met: 0 },
      }),
    );
    expect(period.caption).toBe('In the last 12 weeks');
    expect(period.tiles[0]).toMatchObject({ note: 'Nothing finished yet' });
    expect(period.tiles[0].chip).toBeUndefined();
    expect(period.tiles[1]).toMatchObject({
      value: 'None yet',
      note: 'Shown after the first finished task',
    });
    expect(period.tiles[2]).toMatchObject({
      value: 'None yet',
      note: 'Shown after the first finished task',
    });
  });
});

describe('time in each column', () => {
  const waits = [
    column('Backlog', 1.2),
    column('To do', 0.6),
    column('Review', 1.6),
  ];

  it('scales the bars to the longest wait, all in its unit', () => {
    expect(waitRows(waits)).toMatchObject([
      { name: 'Backlog', value: '1.2', unit: 'days', slowest: false },
      { name: 'To do', value: '0.6', unit: 'days', slowest: false },
      {
        name: 'Review',
        value: '1.6',
        unit: 'days',
        percent: 100,
        slowest: true,
      },
    ]);
    expect(
      waitRows([column('To do', 0.25), column('Review', 0.5)]),
    ).toMatchObject([
      { value: '6.0', unit: 'hours', percent: 50 },
      { value: '12.0', unit: 'hours', percent: 100 },
    ]);
    expect(waitRows(waits)[0].percent).toBeCloseTo(75);
    expect(waitRows([column('To do', 0)])[0]).toMatchObject({
      percent: 0,
      slowest: false,
    });
  });

  it('marks one column as the slowest when two tie', () => {
    expect(
      waitRows([column('To do', 2), column('Review', 2)]).map((r) => r.slowest),
    ).toEqual([true, false]);
  });

  it('names the column that holds tasks longest, or says there is no history', () => {
    expect(waitNote(waits, 12, 4)).toBe(
      'Tasks wait the longest in Review. Based on 12 tasks finished in these 4 weeks.',
    );
    expect(waitNote(waits, 1, 12)).toBe(
      'Tasks wait the longest in Review. Based on 1 task finished in these 12 weeks.',
    );
    expect(waitNote(waits, 0, 4)).toBe(
      'No moves between columns were recorded for the tasks finished in these 4 weeks.',
    );
    expect(waitNote([column('To do', 0)], 3, 4)).toMatch(/^No moves/);
  });
});

describe('lists', () => {
  const item: AttentionItem = {
    id: 't1',
    title: 'Realtime presence on cards',
    kind: 'stuck',
    columnName: 'Review',
    dueDate: null,
    overdueDays: 0,
    idleDays: 9,
    dueInDays: 0,
    waitingOn: null,
    assignees: [
      { id: 'u1', fullName: 'Ploy Srisai', avatar: null },
      { id: 'u2', fullName: 'Arthit Kaew', avatar: null },
    ],
  };

  it('gives an attention row its chip, reason and first assignee', () => {
    expect(attentionRows([item, { ...item, id: 't2', assignees: [] }])).toEqual(
      [
        {
          id: 't1',
          kind: 'stuck',
          label: 'Stuck',
          title: 'Realtime presence on cards',
          why: 'Review · has not moved for 9 days',
          owner: item.assignees[0],
          ownerNames: 'Ploy Srisai, Arthit Kaew',
        },
        expect.objectContaining({ owner: null, ownerNames: 'Unassigned' }),
      ],
    );
  });

  it('gives an upcoming row its due day, in the zone, and how far off it is', () => {
    const due: AttentionItem = {
      ...item,
      kind: 'due_soon',
      columnName: 'To do',
      // 18:00 UTC on Wednesday is already Thursday in Bangkok
      dueDate: '2026-11-11T18:00:00Z',
      dueInDays: 1,
    };
    expect(upcomingRows([due], 'Asia/Bangkok')).toEqual([
      {
        id: 't1',
        title: 'Realtime presence on cards',
        weekday: 'Thu',
        day: '12',
        why: 'To do · due tomorrow',
        owner: item.assignees[0],
        ownerNames: 'Ploy Srisai, Arthit Kaew',
      },
    ]);
    expect(upcomingRows([due], 'UTC')[0]).toMatchObject({
      weekday: 'Wed',
      day: '11',
    });
    expect(dueInText(0)).toBe('due today');
    expect(dueInText(1)).toBe('due tomorrow');
    expect(dueInText(6)).toBe('due in 6 days');
  });

  it('says how many more there are than the list shows', () => {
    expect(moreLine(8, 8)).toBeNull();
    expect(moreLine(9, 8)).toBe('and 1 more task');
    expect(moreLine(12, 8)).toBe('and 4 more tasks');
  });

  it('splits workload bars into overdue and the rest, scaled to the busiest', () => {
    const person = { id: 'u1', fullName: 'Noravut Chaiyasit', avatar: null };
    expect(
      workloadRows([
        { person, open: 4, overdue: 1, done: 21 },
        { person: null, open: 1, overdue: 1, done: 0 },
      ]),
    ).toEqual([
      {
        key: 'u1',
        person,
        name: 'Noravut C.',
        open: 4,
        overdue: 1,
        latePercent: 25,
        restPercent: 75,
        done: '21 finished',
      },
      {
        key: 'unassigned',
        person: null,
        name: 'Unassigned',
        open: 1,
        overdue: 1,
        latePercent: 25,
        restPercent: 0,
        done: '',
      },
    ]);
    expect(
      workloadRows([{ person, open: 0, overdue: 0, done: 2 }])[0],
    ).toMatchObject({ latePercent: 0, restPercent: 0, done: '2 finished' });
  });
});

describe('digestStatusLine', () => {
  const state = {
    on: true,
    nextAt: '2026-11-16T02:00:00.000Z',
    emailOff: false,
  };

  it('says when the next one goes out, or why none will', () => {
    expect(digestStatusLine(state, false)).toMatch(
      /^Next one: \w+day, Nov 1\d$/,
    );
    expect(digestStatusLine({ ...state, on: false }, false)).toBe(
      'No emails will be sent',
    );
    expect(digestStatusLine(null, false)).toBe('No emails will be sent');
    expect(digestStatusLine({ ...state, emailOff: true }, false)).toBe(
      'Emails are turned off in your settings',
    );
    expect(digestStatusLine(state, true)).toMatch(
      /^The guest demo has no inbox/,
    );
  });
});
