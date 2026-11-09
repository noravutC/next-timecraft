import type { ActivityColumnRef, TaskActivityEntry, TaskRow } from '@/types';

type Diffable = Pick<
  TaskRow,
  | 'columnId'
  | 'title'
  | 'description'
  | 'priority'
  | 'dueDate'
  | 'tags'
  | 'estimatedHours'
  | 'archived'
>;

const instant = (d: Date | null) => (d ? d.getTime() : null);
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/** what is in `after` but not `before`, and the other way round */
export const listDiff = (before: string[], after: string[]) => ({
  added: after.filter((x) => !before.includes(x)),
  removed: before.filter((x) => !after.includes(x)),
});

/**
 * The history entries one task update produces, one per changed field.
 * Reordering inside a column changes nothing worth recording.
 */
export function diffTaskActivity(
  before: Diffable,
  after: Diffable,
  columns: ReadonlyMap<string, ActivityColumnRef>,
): TaskActivityEntry[] {
  const out: TaskActivityEntry[] = [];
  if (before.columnId !== after.columnId) {
    out.push({
      type: 'moved',
      data: {
        from: columns.get(before.columnId) ?? null,
        to: columns.get(after.columnId) ?? null,
      },
    });
  }
  if (before.title !== after.title) {
    out.push({
      type: 'renamed',
      data: { from: before.title, to: after.title },
    });
  }
  if ((before.description ?? '') !== (after.description ?? '')) {
    out.push({ type: 'description_changed', data: {} });
  }
  if (before.priority !== after.priority) {
    out.push({
      type: 'priority_changed',
      data: { from: before.priority, to: after.priority },
    });
  }
  if (instant(before.dueDate) !== instant(after.dueDate)) {
    out.push({
      type: 'due_changed',
      data: { from: iso(before.dueDate), to: iso(after.dueDate) },
    });
  }
  const labels = listDiff(before.tags, after.tags);
  if (labels.added.length || labels.removed.length) {
    out.push({ type: 'labels_changed', data: labels });
  }
  if (before.estimatedHours !== after.estimatedHours) {
    out.push({
      type: 'estimate_changed',
      data: { from: before.estimatedHours, to: after.estimatedHours },
    });
  }
  if (!before.archived && after.archived) {
    out.push({ type: 'archived', data: {} });
  }
  if (before.archived && !after.archived) {
    out.push({ type: 'restored', data: {} });
  }
  return out;
}
