import { describe, expect, it } from 'vitest';
import { byOrderFraction, dropFraction } from './subtask-order';

const items = [
  { id: 'a', orderFraction: 'a0' },
  { id: 'b', orderFraction: 'a1' },
  { id: 'c', orderFraction: 'a2' },
];

const orderAfter = (id: string, fraction: string) =>
  byOrderFraction(
    items.map((i) => (i.id === id ? { ...i, orderFraction: fraction } : i)),
  )
    .map((i) => i.id)
    .join('');

describe('dropFraction', () => {
  it('lands above or below the item it is dropped on', () => {
    expect(orderAfter('c', dropFraction(items, 'c', 'a', 'top')!)).toBe('cab');
    expect(orderAfter('a', dropFraction(items, 'a', 'c', 'bottom')!)).toBe(
      'bca',
    );
    expect(orderAfter('a', dropFraction(items, 'a', 'b', 'bottom')!)).toBe(
      'bac',
    );
  });

  it('does nothing when dropped where it already is', () => {
    expect(dropFraction(items, 'b', 'a', 'bottom')).toBeNull();
    expect(dropFraction(items, 'b', 'c', 'top')).toBeNull();
    expect(dropFraction(items, 'b', 'b', 'top')).toBeNull();
  });
});
