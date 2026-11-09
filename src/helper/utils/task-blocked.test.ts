import { describe, expect, it } from 'vitest';
import { finishColumnOf, isBlocked } from './task-blocked';

const blocker = (columnId: string, archived = false) => ({
  id: 'b',
  columnId,
  archived,
});

describe('isBlocked', () => {
  it('is blocked until every blocker is finished or archived', () => {
    expect(isBlocked([blocker('todo')], {}, 'done')).toBe(true);
    expect(isBlocked([blocker('done')], {}, 'done')).toBe(false);
    expect(isBlocked([blocker('todo', true)], {}, 'done')).toBe(false);
    expect(isBlocked(undefined, {}, 'done')).toBe(false);
  });

  it('follows the blocker as it moves', () => {
    expect(
      isBlocked(
        [blocker('todo')],
        { b: { columnId: 'done', archived: false } },
        'done',
      ),
    ).toBe(false);
  });
});

describe('finishColumnOf', () => {
  it('is the last column of that board, by order', () => {
    const columns = [
      { id: 'a', projectId: 'p', orderFraction: 'a0' },
      { id: 'c', projectId: 'p', orderFraction: 'a2' },
      { id: 'b', projectId: 'p', orderFraction: 'a1' },
      { id: 'x', projectId: 'other', orderFraction: 'z' },
    ];
    expect(finishColumnOf(columns, 'p')).toBe('c');
    expect(finishColumnOf(columns, 'none')).toBeNull();
  });
});
