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
  it('is the Done column of that board, wherever it sits', () => {
    const columns = [
      { id: 'a', projectId: 'p', isDone: false },
      { id: 'b', projectId: 'p', isDone: true },
      { id: 'c', projectId: 'p', isDone: false },
      { id: 'x', projectId: 'other', isDone: true },
    ];
    expect(finishColumnOf(columns, 'p')).toBe('b');
    expect(finishColumnOf(columns, 'none')).toBeNull();
  });

  it('is null on a board without a Done column', () => {
    expect(
      finishColumnOf([{ id: 'a', projectId: 'p', isDone: false }], 'p'),
    ).toBeNull();
  });
});
