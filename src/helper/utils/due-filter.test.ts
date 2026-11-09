import { describe, expect, it } from 'vitest';
import { dueBounds, dueBucketOf } from './due-filter';

// Wednesday Nov 4, 2026, mid-afternoon local time
const now = new Date(2026, 10, 4, 15, 30);
const bounds = dueBounds(now);
const day = (d: number) => new Date(2026, 10, d);

describe('dueBounds', () => {
  it('starts today at midnight and ends this week on the next Monday', () => {
    expect(new Date(bounds.today)).toEqual(day(4));
    expect(new Date(bounds.weekEnd)).toEqual(day(9));
  });

  it('on a Monday, this week runs a whole week', () => {
    const monday = dueBounds(new Date(2026, 10, 9, 8));
    expect(new Date(monday.weekEnd)).toEqual(day(16));
  });

  it('on a Sunday, this week is just today', () => {
    const sunday = dueBounds(new Date(2026, 10, 8, 20));
    expect(new Date(sunday.weekEnd)).toEqual(day(9));
  });
});

describe('dueBucketOf', () => {
  it('sorts a due date into its bucket', () => {
    expect(dueBucketOf(day(3), bounds)).toBe('overdue');
    expect(dueBucketOf(day(4), bounds)).toBe('this_week');
    expect(dueBucketOf(day(8), bounds)).toBe('this_week');
    expect(dueBucketOf(day(9), bounds)).toBe('later');
    expect(dueBucketOf(null, bounds)).toBe('none');
  });
});
