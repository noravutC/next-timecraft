import { describe, expect, it } from 'vitest';
import { shiftedColumnFraction } from './board-operations';

const columns = [
  { id: 'a', orderFraction: 'a0' },
  { id: 'b', orderFraction: 'a1' },
  { id: 'c', orderFraction: 'a2' },
];

const orderAfter = (id: string, fraction: string) =>
  columns
    .map((c) => (c.id === id ? { ...c, orderFraction: fraction } : c))
    .sort((x, y) => (x.orderFraction < y.orderFraction ? -1 : 1))
    .map((c) => c.id)
    .join('');

describe('shiftedColumnFraction', () => {
  it('moves a column one place left or right', () => {
    expect(orderAfter('c', shiftedColumnFraction(columns, 'c', -1)!)).toBe(
      'acb',
    );
    expect(orderAfter('a', shiftedColumnFraction(columns, 'a', 1)!)).toBe(
      'bac',
    );
    expect(orderAfter('b', shiftedColumnFraction(columns, 'b', -1)!)).toBe(
      'bac',
    );
  });

  it('stops at the ends', () => {
    expect(shiftedColumnFraction(columns, 'a', -1)).toBeNull();
    expect(shiftedColumnFraction(columns, 'c', 1)).toBeNull();
  });
});
