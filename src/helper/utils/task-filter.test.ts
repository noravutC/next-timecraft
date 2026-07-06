import { describe, it, expect } from 'vitest';
import { isTaskFilterActive, taskMatchesFilter } from './task-filter';
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

  it('combines conditions with AND', () => {
    expect(
      taskMatchesFilter(task(), { q: 'design', priorities: ['medium'] }),
    ).toBe(true);
    expect(
      taskMatchesFilter(task(), { q: 'design', priorities: ['high'] }),
    ).toBe(false);
  });
});
