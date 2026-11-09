import { db } from '@/db';
import { taskAssigneesTable, tasksTable } from '@/db/schema';
import type { DueBounds, DueBucket, TaskFilter } from '@/types';
import {
  and,
  arrayOverlaps,
  count,
  eq,
  ilike,
  inArray,
  isNull,
  notExists,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

const dueAt = (iso: string) => sql`${iso}::timestamptz`;

const dueCondition = (bucket: DueBucket, bounds: DueBounds): SQL => {
  const today = dueAt(bounds.today);
  const weekEnd = dueAt(bounds.weekEnd);
  switch (bucket) {
    case 'overdue':
      return sql`${tasksTable.dueDate} < ${today}`;
    case 'this_week':
      return sql`(${tasksTable.dueDate} >= ${today} and ${tasksTable.dueDate} < ${weekEnd})`;
    case 'later':
      return sql`${tasksTable.dueDate} >= ${weekEnd}`;
    case 'none':
      return isNull(tasksTable.dueDate);
  }
};

const assignedTo = (userIds: string[]) =>
  inArray(
    tasksTable.id,
    db
      .select({ id: taskAssigneesTable.taskId })
      .from(taskAssigneesTable)
      .where(inArray(taskAssigneesTable.userId, userIds)),
  );

/**
 * The board filter as conditions on tasks. "Assigned to me" is the user
 * asking; the assignee choices widen each other (these people, or nobody).
 */
export function taskFilterConditions(
  filter: TaskFilter | undefined,
  userId: string,
): SQL[] {
  if (!filter) return [];
  const conditions: SQL[] = [];
  if (filter.q) {
    conditions.push(ilike(tasksTable.title, `%${filter.q}%`));
  }
  if (filter.priorities?.length) {
    conditions.push(inArray(tasksTable.priority, filter.priorities));
  }
  if (filter.tags?.length) {
    conditions.push(arrayOverlaps(tasksTable.tags, filter.tags));
  }
  const bounds = filter.dueBounds;
  if (filter.due?.length && bounds) {
    conditions.push(or(...filter.due.map((b) => dueCondition(b, bounds)))!);
  }
  const people = [
    ...(filter.assigneeIds ?? []),
    ...(filter.mine ? [userId] : []),
  ];
  const anyOf: SQL[] = [];
  if (people.length) anyOf.push(assignedTo(people));
  if (filter.unassigned) {
    anyOf.push(
      notExists(
        db
          .select({ id: taskAssigneesTable.taskId })
          .from(taskAssigneesTable)
          .where(eq(taskAssigneesTable.taskId, tasksTable.id)),
      ),
    );
  }
  if (anyOf.length) conditions.push(or(...anyOf)!);
  return conditions;
}

/**
 * Counts for the Due date and Assignee menus. Like the priority counts they
 * ignore the filter, so each option says how many tasks it would show.
 */
export async function countFilterOptions(
  columnIds: string[],
  userId: string,
  bounds: DueBounds,
): Promise<{ due: Record<DueBucket, number>; mine: number }> {
  const onBoard = and(
    inArray(tasksTable.columnId, columnIds),
    eq(tasksTable.archived, false),
  );
  const today = dueAt(bounds.today);
  const weekEnd = dueAt(bounds.weekEnd);
  const bucket = sql<DueBucket>`case
    when ${tasksTable.dueDate} is null then 'none'
    when ${tasksTable.dueDate} < ${today} then 'overdue'
    when ${tasksTable.dueDate} < ${weekEnd} then 'this_week'
    else 'later' end`;
  const [dueRows, [mineRow]] = await Promise.all([
    db
      .select({ bucket, total: count() })
      .from(tasksTable)
      .where(onBoard)
      .groupBy(sql`1`),
    db
      .select({ total: count() })
      .from(tasksTable)
      .where(and(onBoard, assignedTo([userId]))),
  ]);
  const due: Record<DueBucket, number> = {
    overdue: 0,
    this_week: 0,
    later: 0,
    none: 0,
  };
  for (const row of dueRows) due[row.bucket] = row.total;
  return { due, mine: mineRow?.total ?? 0 };
}
