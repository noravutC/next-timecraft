import { describe, expect, it } from 'vitest';
import type { MyTask } from '@/types';
import {
  dueGroupOf,
  groupByBoard,
  groupByDue,
  myTaskDueLabel,
  myTasksView,
} from './my-tasks';

// Saturday Nov 7, 2026
const now = new Date(2026, 10, 7, 10);
const day = (d: number) => new Date(2026, 10, d);

const task = (id: string, dueDate: Date | null, projectId = 'p'): MyTask => ({
  id,
  title: id,
  priority: 'medium',
  dueDate,
  projectId,
  columnId: 'c',
  columnName: 'To do',
  columnColor: null,
  finished: false,
  blocked: false,
  assignees: [],
});

describe('dueGroupOf', () => {
  it('splits by today, the coming Monday and the Monday after', () => {
    expect(dueGroupOf(day(4), now)).toBe('overdue');
    expect(dueGroupOf(day(8), now)).toBe('this_week');
    expect(dueGroupOf(day(9), now)).toBe('next_week');
    expect(dueGroupOf(day(15), now)).toBe('next_week');
    expect(dueGroupOf(day(16), now)).toBe('later');
    expect(dueGroupOf(null, now)).toBe('none');
  });
});

describe('grouping', () => {
  it('orders groups and tasks by when they are due', () => {
    const groups = groupByDue(
      [
        task('later', day(24)),
        task('none', null),
        task('late', day(4)),
        task('soon', day(8)),
      ],
      now,
    );
    expect(groups.map((g) => g.key)).toEqual([
      'overdue',
      'this_week',
      'later',
      'none',
    ]);
  });

  it('keeps boards in the order given', () => {
    const groups = groupByBoard(
      [task('a', null, 'b2'), task('b', null, 'b1')],
      ['b1', 'b2'],
    );
    expect(groups.map((g) => g.key)).toEqual(['b1', 'b2']);
  });

  it('says Today and Tomorrow, and the weekday for next week', () => {
    expect(myTaskDueLabel(day(7), now)).toBe('Today');
    expect(myTaskDueLabel(day(8), now)).toBe('Tomorrow');
    expect(myTaskDueLabel(day(9), now)).toBe('Mon, Nov 9');
    expect(myTaskDueLabel(day(24), now)).toBe('Nov 24');
    expect(myTaskDueLabel(day(4), now)).toBe('Nov 4');
  });
});

describe('myTasksView', () => {
  it('counts open work and hides finished tasks until asked', () => {
    const done = { ...task('done', null), finished: true };
    const view = myTasksView([task('a', day(8)), done], {
      grouping: 'due',
      showDone: false,
      boards: {},
      now,
    });
    expect(view.openCount).toBe(1);
    expect(view.doneCount).toBe(1);
    expect(view.shownCount).toBe(1);
    expect(view.groups[0]).toMatchObject({
      key: 'this_week',
      label: 'This week',
    });
  });
});
