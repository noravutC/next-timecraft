import type { DueBounds, DueBucket } from '@/types';

export const DUE_BUCKETS: DueBucket[] = [
  'overdue',
  'this_week',
  'later',
  'none',
];

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: 'Overdue',
  this_week: 'Due this week',
  later: 'Due later',
  none: 'No due date',
};

/**
 * The edges between buckets, in local time: overdue is before today,
 * this week runs to the next Monday (weeks start on Monday).
 */
export const dueBounds = (now: Date = new Date()): DueBounds => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  return { today: today.toISOString(), weekEnd: weekEnd.toISOString() };
};

export const dueBucketOf = (
  dueDate: Date | string | null | undefined,
  bounds: DueBounds,
): DueBucket => {
  if (!dueDate) return 'none';
  const at = new Date(dueDate).getTime();
  if (at < new Date(bounds.today).getTime()) return 'overdue';
  if (at < new Date(bounds.weekEnd).getTime()) return 'this_week';
  return 'later';
};
