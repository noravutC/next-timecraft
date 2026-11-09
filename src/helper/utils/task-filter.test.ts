import { describe, it, expect } from 'vitest';
import {
  isTaskFilterActive,
  resolveMine,
  sumPriorityCounts,
  taskMatchesFilter,
} from './task-filter';
import type { TaskCache } from '@/types';

const task = (overrides: Partial<TaskCache> = {}) =>
  ({
    title: 'Design landing page',
    priority: 'medium',
    tags: ['web', 'design'],
    ...overrides,
  }) as TaskCache;

describe('isTaskFilterActive', () => {
  it('is false for undefined or empty filters', () => {
    expect(isTaskFilterActive(undefined)).toBe(false);
    expect(isTaskFilterActive({})).toBe(false);
    expect(isTaskFilterActive({ q: '   ' })).toBe(false);
  });

  it('is true when any condition is set', () => {
    expect(isTaskFilterActive({ q: 'x' })).toBe(true);
    expect(isTaskFilterActive({ priorities: ['high'] })).toBe(true);
    expect(isTaskFilterActive({ tags: ['web'] })).toBe(true);
    expect(isTaskFilterActive({ assigneeIds: ['u1'] })).toBe(true);
  });
});

describe('taskMatchesFilter', () => {
  it('matches everything when no filter is active', () => {
    expect(taskMatchesFilter(task(), undefined)).toBe(true);
    expect(taskMatchesFilter(task(), {})).toBe(true);
  });

  it('matches the title case-insensitively as a substring', () => {
    expect(taskMatchesFilter(task(), { q: 'LANDING' })).toBe(true);
    expect(taskMatchesFilter(task(), { q: 'invoice' })).toBe(false);
  });

  it('filters by priority membership', () => {
    expect(taskMatchesFilter(task(), { priorities: ['medium', 'high'] })).toBe(
      true,
    );
    expect(taskMatchesFilter(task(), { priorities: ['high'] })).toBe(false);
  });

  it('filters by tag overlap', () => {
    expect(taskMatchesFilter(task(), { tags: ['design', 'ops'] })).toBe(true);
    expect(taskMatchesFilter(task(), { tags: ['backend'] })).toBe(false);
    expect(taskMatchesFilter(task({ tags: [] }), { tags: ['web'] })).toBe(
      false,
    );
  });

  it('filters by assignee intersection', () => {
    expect(
      taskMatchesFilter(task(), { assigneeIds: ['u1'] }, ['u1', 'u2']),
    ).toBe(true);
    expect(taskMatchesFilter(task(), { assigneeIds: ['u9'] }, ['u1'])).toBe(
      false,
    );
    expect(taskMatchesFilter(task(), { assigneeIds: ['u1'] })).toBe(false);
  });

  it('filters by due date bucket', () => {
    const dueBounds = {
      today: new Date(2026, 10, 4).toISOString(),
      weekEnd: new Date(2026, 10, 9).toISOString(),
    };
    const overdue = task({ dueDate: new Date(2026, 10, 2) });
    expect(taskMatchesFilter(overdue, { due: ['overdue'], dueBounds })).toBe(
      true,
    );
    expect(taskMatchesFilter(overdue, { due: ['later'], dueBounds })).toBe(
      false,
    );
    expect(
      taskMatchesFilter(task({ dueDate: null }), { due: ['none'], dueBounds }),
    ).toBe(true);
  });

  it('matches anyone chosen or nobody, when both are asked for', () => {
    const filter = { assigneeIds: ['u1'], unassigned: true };
    expect(taskMatchesFilter(task(), filter, [])).toBe(true);
    expect(taskMatchesFilter(task(), filter, ['u1'])).toBe(true);
    expect(taskMatchesFilter(task(), filter, ['u2'])).toBe(false);
    expect(taskMatchesFilter(task(), { unassigned: true }, ['u2'])).toBe(false);
  });

  it('combines conditions with AND', () => {
    expect(
      taskMatchesFilter(task(), { q: 'design', priorities: ['medium'] }),
    ).toBe(true);
    expect(
      taskMatchesFilter(task(), { q: 'design', priorities: ['high'] }),
    ).toBe(false);
  });
});

describe('sumPriorityCounts', () => {
  it('adds the counts of the given columns only', () => {
    const byColumn = {
      a: { high: 1, medium: 2 },
      b: { medium: 3, low: 1 },
      c: { high: 9 },
    };
    expect(sumPriorityCounts(byColumn, ['a', 'b'])).toEqual({
      high: 1,
      medium: 5,
      low: 1,
    });
    expect(sumPriorityCounts(byColumn, [])).toEqual({});
  });
});

describe('resolveMine', () => {
  it('turns "Assigned to me" into the viewer as an assignee', () => {
    expect(resolveMine({ mine: true, assigneeIds: ['u2'] }, 'u1')).toEqual({
      assigneeIds: ['u2', 'u1'],
    });
    expect(resolveMine({ mine: true }, null)).toEqual({ mine: true });
  });
});
