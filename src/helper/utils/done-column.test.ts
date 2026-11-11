import { describe, expect, it } from 'vitest';
import { reopenColumnId } from './done-column';

const col = (id: string, orderFraction: string, isDone = false) => ({
  id,
  orderFraction,
  isDone,
});

describe('reopenColumnId', () => {
  const board = [
    col('todo', 'a0'),
    col('doing', 'a1'),
    col('done', 'a2', true),
    col('later', 'a3'),
  ];

  it('goes back to the column the task came from', () => {
    expect(reopenColumnId(board, 'todo')).toBe('todo');
  });

  it('falls back to the column just before Done', () => {
    expect(reopenColumnId(board, null)).toBe('doing');
    // the column it came from was deleted since
    expect(reopenColumnId(board, 'gone')).toBe('doing');
  });

  it('never returns the Done column itself', () => {
    expect(reopenColumnId(board, 'done')).toBe('doing');
  });

  it('takes the first other column when Done comes first', () => {
    expect(
      reopenColumnId([col('done', 'a0', true), col('next', 'a1')], null),
    ).toBe('next');
  });

  it('is null when Done is the only column', () => {
    expect(reopenColumnId([col('done', 'a0', true)], null)).toBeNull();
  });
});
