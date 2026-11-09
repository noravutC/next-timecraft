import { describe, expect, it } from 'vitest';
import { archivedBoardMeta } from './archived-board';

const now = new Date('2026-11-06T12:00:00Z');

describe('archivedBoardMeta', () => {
  it('says who archived it, when, and how big it is', () => {
    expect(
      archivedBoardMeta(
        {
          archivedAt: new Date('2026-10-28T09:00:00Z'),
          archivedByName: 'Ploy Srisuk',
          memberCount: 4,
          taskCount: 23,
        },
        now,
      ),
    ).toBe('Archived by Ploy S. on Oct 28 · 4 members · 23 tasks');
  });

  it('leaves out what wasn’t recorded', () => {
    expect(
      archivedBoardMeta(
        {
          archivedAt: null,
          archivedByName: null,
          memberCount: 1,
          taskCount: 1,
        },
        now,
      ),
    ).toBe('Archived · 1 member · 1 task');
  });
});
