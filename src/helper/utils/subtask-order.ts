import { generateFractionBetween } from './fraction-string-indexing';

type Ordered = { id: string; orderFraction: string; createdAt?: Date | string };

/**
 * Fractional keys compare by code unit, the same as the database's "C";
 * equal keys fall back to creation order.
 */
export const byOrderFraction = <T extends Ordered>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    if (a.orderFraction === b.orderFraction) {
      return (
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
      );
    }
    return a.orderFraction < b.orderFraction ? -1 : 1;
  });

/**
 * Where a dragged item lands when dropped on the top or bottom edge of
 * another. Null for no move: onto itself, or back into the same gap.
 */
export const dropFraction = <T extends Ordered>(
  items: T[],
  draggedId: string,
  targetId: string,
  edge: 'top' | 'bottom',
): string | null => {
  if (draggedId === targetId) return null;
  const sorted = byOrderFraction(items);
  const rest = sorted.filter((i) => i.id !== draggedId);
  const at = rest.findIndex((i) => i.id === targetId);
  if (at === -1) return null;
  const before = edge === 'top' ? rest[at - 1] : rest[at];
  const after = edge === 'top' ? rest[at] : rest[at + 1];
  const from = sorted.findIndex((i) => i.id === draggedId);
  if (
    sorted[from - 1]?.id === before?.id &&
    sorted[from + 1]?.id === after?.id
  ) {
    return null;
  }
  return generateFractionBetween(
    before?.orderFraction ?? null,
    after?.orderFraction ?? null,
  );
};
