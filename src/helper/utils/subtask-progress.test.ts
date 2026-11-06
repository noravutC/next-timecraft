import { describe, expect, it } from 'vitest';
import { progressFromItems, progressPercent } from './subtask-progress';

describe('progressFromItems', () => {
  it('counts completed items', () => {
    expect(
      progressFromItems([
        { completed: true },
        { completed: false },
        { completed: true },
        { completed: false },
      ]),
    ).toEqual({ done: 2, total: 4 });
  });
  it('is null when there are no subtasks', () => {
    expect(progressFromItems([])).toBeNull();
  });
});

describe('progressPercent', () => {
  it('rounds to a whole percent', () => {
    expect(progressPercent({ done: 1, total: 3 })).toBe(33);
    expect(progressPercent(null)).toBe(0);
  });
});
