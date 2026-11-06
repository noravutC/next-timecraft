import { describe, expect, it } from 'vitest';
import { dueUrgency, formatDueLabel } from './date-format';

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
