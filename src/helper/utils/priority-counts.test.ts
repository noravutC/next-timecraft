import { describe, expect, it } from 'vitest';
import { shiftPriorityCounts, type CountedTask } from './priority-counts';

const task = (
  columnId: string,
  priority: CountedTask['priority'],
  archived = false,
): CountedTask => ({ columnId, priority, archived });

describe('shiftPriorityCounts', () => {
  const counts = { todo: { high: 1, medium: 2 }, done: { low: 1 } };

  it('counts a created task', () => {
    expect(shiftPriorityCounts(counts, [[null, task('todo', 'high')]])).toEqual(
      { todo: { high: 2, medium: 2 }, done: { low: 1 } },
    );
  });

  it('moves a task between columns and priorities', () => {
    expect(
      shiftPriorityCounts(counts, [
        [task('todo', 'medium'), task('done', 'high')],
      ]),
    ).toEqual({ todo: { high: 1, medium: 1 }, done: { low: 1, high: 1 } });
  });

  it('treats archiving as removal and never goes below zero', () => {
    expect(
      shiftPriorityCounts(counts, [
        [task('done', 'low'), task('done', 'low', true)],
        [task('done', 'medium'), null],
      ]),
    ).toEqual({ todo: { high: 1, medium: 2 }, done: { low: 0, medium: 0 } });
  });

  it('ignores edits that keep the column and priority', () => {
    expect(
      shiftPriorityCounts(counts, [
        [task('todo', 'high'), task('todo', 'high')],
      ]),
    ).toEqual(counts);
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(counts);
    shiftPriorityCounts(counts, [[null, task('todo', 'low')]]);
    expect(JSON.stringify(counts)).toBe(before);
  });
});
