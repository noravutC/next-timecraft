// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AttentionItem } from '@/types';
import { AttentionCard } from './attention-card';
import { FlowChart } from './flow-chart';
import { InsightTiles } from './insight-tiles';
import { InsightsEmpty } from './insights-empty';
import { InsightsSkeleton } from './insights-skeleton';
import { InsightsSummary } from './insights-summary';
import { UpcomingCard } from './upcoming-card';
import { WaitCard } from './wait-card';
import { WorkloadCard } from './workload-card';

const attention = (over: Partial<AttentionItem>): AttentionItem => ({
  id: 't1',
  title: 'Fix drag preview offset in Safari',
  kind: 'overdue',
  columnName: 'In progress',
  dueDate: '2026-11-10T05:00:00Z',
  overdueDays: 1,
  idleDays: 0,
  dueInDays: 0,
  waitingOn: null,
  assignees: [{ id: 'u1', fullName: 'Arthit Kaew', avatar: null }],
  ...over,
});

describe('InsightsSummary', () => {
  it('leads the page with the week so far', () => {
    render(<InsightsSummary text="5 tasks finished and 3 new." />);
    expect(screen.getByText('This week so far:')).toBeVisible();
    expect(screen.getByText(/5 tasks finished and 3 new\./)).toBeVisible();
  });
});

describe('InsightTiles', () => {
  it('shows each group with its numbers, units and notes', () => {
    render(
      <InsightTiles
        groups={[
          {
            caption: 'In the last 12 weeks',
            tiles: [
              {
                key: 'finished',
                label: 'Finished',
                value: '61',
                unit: 'tasks',
                note: 'than the 12 weeks before',
                chip: { text: '9 more', arrow: 'up', good: true },
              },
              {
                key: 'onTime',
                label: 'On time',
                value: '82',
                unit: '%',
                note: '23 of 28 tasks with a due date',
                ring: 82,
              },
            ],
          },
          {
            caption: 'Right now',
            tiles: [
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
        ]}
      />,
    );
    const period = screen.getByRole('region', { name: 'In the last 12 weeks' });
    expect(within(period).getByText('Finished')).toBeVisible();
    expect(within(period).getByText('61')).toBeVisible();
    expect(within(period).getByText('9 more')).toBeVisible();
    expect(within(period).getByText('than the 12 weeks before')).toBeVisible();
    expect(
      within(period).getByText('23 of 28 tasks with a due date'),
    ).toBeVisible();
    const now = screen.getByRole('region', { name: 'Right now' });
    expect(within(now).getByText('Overdue')).toBeVisible();
    expect(within(now).getByText('Due date has passed')).toBeVisible();
  });
});

describe('FlowChart', () => {
  const finished = [
    { start: '2026-11-02', count: 8 },
    { start: '2026-11-09', count: 5 },
  ];
  const created = [
    { start: '2026-11-02', count: 6 },
    { start: '2026-11-09', count: 3 },
  ];

  it('names every pair of bars with its week and both counts', () => {
    render(<FlowChart finished={finished} created={created} />);
    const chart = screen.getByRole('region', {
      name: 'New and finished tasks',
    });
    expect(
      within(chart).getByRole('img', {
        name: 'Nov 2 to Nov 8: 8 finished, 6 new',
      }),
    ).toBeInTheDocument();
    expect(
      within(chart).getByRole('img', {
        name: 'Nov 9 to today: 5 finished, 3 new so far',
      }),
    ).toBeInTheDocument();
    expect(
      within(chart).getByText('Each week · 6.5 finished a week on average'),
    ).toBeVisible();
    expect(
      within(chart).getByText(
        '4 more tasks were finished than added in these 2 weeks: 9 new, 13 finished.',
      ),
    ).toBeVisible();
  });

  it('has a legend for its two series', () => {
    render(<FlowChart finished={finished} created={created} />);
    const legend = screen.getByRole('list');
    expect(within(legend).getByText('Finished')).toBeVisible();
    expect(within(legend).getByText('New')).toBeVisible();
  });
});

describe('WaitCard', () => {
  const waits = [
    { id: 'c1', name: 'In progress', color: '#f59e0b', days: 1.4 },
    { id: 'c2', name: 'Review', color: '#8b5cf6', days: 1.9 },
  ];

  it('lists each column with its average and marks the slowest', () => {
    render(<WaitCard waits={waits} tasks={12} weeks={12} />);
    const card = screen.getByRole('region', { name: 'Time in each column' });
    const rows = within(card).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText('1.9')).toBeVisible();
    expect(within(rows[1]).getByText('Slowest')).toBeVisible();
    expect(within(rows[0]).queryByText('Slowest')).toBeNull();
    expect(
      within(card).getByText(/^Tasks wait the longest in Review\./),
    ).toBeVisible();
  });

  it('shows only the note when no moves were recorded', () => {
    render(<WaitCard waits={waits} tasks={0} weeks={4} />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText(/^No moves between columns/)).toBeVisible();
  });
});

describe('AttentionCard', () => {
  it('opens the task a row stands for', async () => {
    const onOpen = vi.fn();
    render(
      <AttentionCard
        items={[
          attention({}),
          attention({
            id: 't2',
            kind: 'stuck',
            idleDays: 9,
            title: 'Presence',
          }),
        ]}
        total={5}
        onOpen={onOpen}
      />,
    );
    const card = screen.getByRole('region', { name: 'Needs attention' });
    expect(within(card).getByText('5')).toBeVisible();
    expect(screen.getByText('In progress · due yesterday')).toBeVisible();
    expect(screen.getByText('and 3 more tasks')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Presence/ }));
    expect(onOpen).toHaveBeenCalledWith('t2');
  });

  it('says so when nothing needs attention', () => {
    render(<AttentionCard items={[]} total={0} onOpen={vi.fn()} />);
    expect(
      screen.getByText('Nothing is overdue, stuck or blocked.'),
    ).toBeVisible();
  });
});

describe('UpcomingCard', () => {
  it('lists what is due soon and opens a task from its row', async () => {
    const onOpen = vi.fn();
    render(
      <UpcomingCard
        items={[
          attention({
            id: 't3',
            kind: 'due_soon',
            title: 'Board cover images',
            columnName: 'To do',
            dueDate: '2026-11-12T05:00:00Z',
            dueInDays: 1,
          }),
        ]}
        total={1}
        timeZone="Asia/Bangkok"
        onOpen={onOpen}
      />,
    );
    const card = screen.getByRole('region', { name: 'Coming up' });
    expect(within(card).getByText('Due in the next 7 days')).toBeVisible();
    expect(within(card).getByText('Thu')).toBeVisible();
    expect(within(card).getByText('12')).toBeVisible();
    expect(within(card).getByText('To do · due tomorrow')).toBeVisible();
    await userEvent.click(
      within(card).getByRole('button', { name: /Board cover images/ }),
    );
    expect(onOpen).toHaveBeenCalledWith('t3');
  });

  it('says so when nothing is due', () => {
    render(
      <UpcomingCard items={[]} total={0} timeZone="UTC" onOpen={vi.fn()} />,
    );
    expect(
      screen.getByText('Nothing is due in the next 7 days.'),
    ).toBeVisible();
  });
});

describe('WorkloadCard', () => {
  it('has a row per person and one for unassigned tasks', () => {
    render(
      <WorkloadCard
        weeks={12}
        workload={[
          {
            person: { id: 'u1', fullName: 'Noravut Chaiyasit', avatar: null },
            open: 4,
            overdue: 1,
            done: 21,
          },
          { person: null, open: 1, overdue: 0, done: 0 },
        ]}
      />,
    );
    const card = screen.getByRole('region', { name: 'Workload' });
    expect(
      within(card).getByText('Open now, and finished in the last 12 weeks'),
    ).toBeVisible();
    const rows = within(card).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Noravut C.')).toBeVisible();
    expect(within(rows[0]).getByText('1 overdue')).toBeVisible();
    expect(within(rows[0]).getByText('21 finished')).toBeVisible();
    expect(within(rows[1]).getByText('Unassigned')).toBeVisible();
    expect(within(rows[1]).queryByText(/overdue/)).toBeNull();
    expect(within(rows[1]).queryByText(/finished/)).toBeNull();
  });

  it('says so when there is nobody to list', () => {
    render(<WorkloadCard weeks={4} workload={[]} />);
    expect(screen.getByText('No open or finished tasks yet.')).toBeVisible();
  });
});

describe('InsightsEmpty', () => {
  it('explains a board with nothing finished and leads back to it', async () => {
    const onBoard = vi.fn();
    render(<InsightsEmpty kind="nothing" onBoard={onBoard} />);
    expect(
      screen.getByRole('heading', { name: 'Nothing finished yet' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Back to the board' }),
    );
    expect(onBoard).toHaveBeenCalled();
  });

  it('explains a board without a Done column', () => {
    render(<InsightsEmpty kind="no-done" onBoard={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'This board has no Done column' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Go to the board' }),
    ).toBeVisible();
  });
});

describe('InsightsSkeleton', () => {
  it('announces that the numbers are loading', () => {
    render(<InsightsSkeleton />);
    expect(
      screen.getByRole('status', { name: 'Loading insights' }),
    ).toBeInTheDocument();
  });
});
