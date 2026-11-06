import { describe, expect, it } from 'vitest';
import {
  dueDatePresets,
  dueUrgency,
  formatDueLabel,
  fromDateInputValue,
  toDateInputValue,
} from './date-format';

describe('dueUrgency', () => {
  it('marks past due dates as overdue', () => {
    expect(dueUrgency(-1)).toBe('overdue');
    expect(dueUrgency(-30)).toBe('overdue');
  });

  it('marks today through two days out as soon', () => {
    expect(dueUrgency(0)).toBe('soon');
    expect(dueUrgency(2)).toBe('soon');
  });

  it('treats three or more days out as normal', () => {
    expect(dueUrgency(3)).toBe('normal');
  });
});

describe('formatDueLabel', () => {
  const at = (offset: number) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  it('names the days next to today', () => {
    expect(formatDueLabel(at(0))).toBe('Today');
    expect(formatDueLabel(at(1))).toBe('Tomorrow');
    expect(formatDueLabel(at(-1))).toBe('Yesterday');
  });

  it('shows month and day otherwise, adding the year only when it differs', () => {
    const now = new Date(2026, 10, 6);
    expect(formatDueLabel(new Date(2026, 10, 12), now)).toBe('Nov 12');
    expect(formatDueLabel(new Date(2027, 0, 3), now)).toBe('Jan 3, 2027');
  });
});

describe('dueDatePresets', () => {
  it('counts from the given day', () => {
    // Thursday 2026-11-05
    const presets = dueDatePresets(new Date(2026, 10, 5, 15, 30));
    const byLabel = Object.fromEntries(
      presets.map((p) => [p.label, toDateInputValue(p.date)]),
    );
    expect(byLabel).toEqual({
      Today: '2026-11-05',
      Tomorrow: '2026-11-06',
      'In 3 days': '2026-11-08',
      'Next Monday': '2026-11-09',
      'In 2 weeks': '2026-11-19',
    });
  });

  it('never picks today as next Monday', () => {
    const monday = dueDatePresets(new Date(2026, 10, 9));
    const next = monday.find((p) => p.label === 'Next Monday')!;
    expect(toDateInputValue(next.date)).toBe('2026-11-16');
  });
});

describe('date input values', () => {
  it('round-trips a local date', () => {
    expect(toDateInputValue(fromDateInputValue('2026-11-12'))).toBe(
      '2026-11-12',
    );
    expect(fromDateInputValue('')).toBeNull();
    expect(toDateInputValue(null)).toBe('');
  });
});
