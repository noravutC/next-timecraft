import { describe, expect, it } from 'vitest';
import { dueUrgency } from './date-format';

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
