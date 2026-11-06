import { describe, expect, it } from 'vitest';
import {
  calendarEntries,
  calendarFilter,
  isOverdueOn,
} from './calendar-operations';

const task = (
  id: string,
  dueDate: Date | null,
  extra: Partial<{ columnId: string; archived: boolean }> = {},
) => ({
  id,
  dueDate,
  columnId: 'todo',
  archived: false,
  createdAt: new Date(2026, 9, 1),
  ...extra,
});

const range = { from: new Date(2026, 10, 1), to: new Date(2026, 11, 6) };
const columnIds = new Set(['todo', 'done']);

describe('calendarEntries', () => {
  it('puts tasks on their day and undated ones in the list', () => {
    const { byDay, undated } = calendarEntries({
      fetched: [task('a', new Date(2026, 10, 12)), task('b', null)],
      live: {},
      columnIds,
      hideUndatedIn: null,
      ...range,
    });
    expect(byDay.get('2026-11-12')?.map((t) => t.id)).toEqual(['a']);
    expect(undated.map((t) => t.id)).toEqual(['b']);
  });

  it('follows the store copy, so a drop moves the task at once', () => {
    const fetched = [task('b', null)];
    const { byDay, undated } = calendarEntries({
      fetched,
      live: { b: task('b', new Date(2026, 10, 20)) },
      columnIds,
      hideUndatedIn: null,
      ...range,
    });
    expect(undated).toHaveLength(0);
    expect(byDay.get('2026-11-20')?.[0].id).toBe('b');
  });

  it('leaves out archived tasks, other boards and finished undated work', () => {
    const { byDay, undated } = calendarEntries({
      fetched: [
        task('a', new Date(2026, 10, 3), { archived: true }),
        task('b', new Date(2026, 10, 3), { columnId: 'elsewhere' }),
        task('c', null, { columnId: 'done' }),
        task('d', new Date(2026, 10, 3), { columnId: 'done' }),
      ],
      live: {},
      columnIds,
      hideUndatedIn: 'done',
      ...range,
    });
    expect(undated).toHaveLength(0);
    expect(byDay.get('2026-11-03')?.map((t) => t.id)).toEqual(['d']);
  });
});

describe('calendarFilter', () => {
  it('drops search and due buckets the calendar has no controls for', () => {
    expect(calendarFilter({ q: 'x', due: ['overdue'], mine: true })).toEqual({
      mine: true,
    });
    expect(calendarFilter({ q: 'x' })).toBeUndefined();
  });
});

describe('isOverdueOn', () => {
  it('is overdue before today, never in the finishing column', () => {
    const today = new Date(2026, 10, 6, 15);
    expect(isOverdueOn(new Date(2026, 10, 5), today, 'todo', 'done')).toBe(
      true,
    );
    expect(isOverdueOn(new Date(2026, 10, 6), today, 'todo', 'done')).toBe(
      false,
    );
    expect(isOverdueOn(new Date(2026, 10, 5), today, 'done', 'done')).toBe(
      false,
    );
  });
});
