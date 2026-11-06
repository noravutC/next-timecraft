import { describe, expect, it } from 'vitest';
import { dayKey, monthGrid, shiftMonth, tasksByDay } from './calendar-grid';

describe('calendar grid', () => {
  it('covers November 2026 in five Sunday-first weeks', () => {
    const cells = monthGrid(2026, 10);
    expect(cells).toHaveLength(35);
    expect(cells[0].key).toBe('2026-11-01');
    expect(cells[0].inMonth).toBe(true);
    expect(cells[34].key).toBe('2026-12-05');
    expect(cells[34].inMonth).toBe(false);
  });

  it('pads the first week with the month before', () => {
    const cells = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(cells[0].key).toBe('2026-09-27');
    expect(cells[4].key).toBe('2026-10-01');
  });

  it('moves across years', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({
      year: 2027,
      month: 0,
    });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({
      year: 2025,
      month: 11,
    });
  });

  it('groups tasks by the local day they are due', () => {
    const due = new Date(2026, 10, 12);
    const days = tasksByDay([
      { id: 'a', dueDate: due },
      { id: 'b', dueDate: due.toISOString() },
      { id: 'c', dueDate: null },
    ]);
    expect(days.get(dayKey(due))?.map((t) => t.id)).toEqual(['a', 'b']);
    expect(days.size).toBe(1);
  });
});
