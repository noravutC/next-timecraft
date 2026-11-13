import { db } from '@/db';
import {
  automationFiredTable,
  columnsTable,
  taskActivitiesTable,
  tasksTable,
} from '@/db/schema';
import type { AutomationRuleRow, TaskRow } from '@/types';
import { and, eq, isNotNull, sql, type SQL } from 'drizzle-orm';

/** How many tasks one rule may act on in one run of the jobs. */
const BATCH = 50;

export type DateCandidate = {
  task: TaskRow;
  /** names the date or the stay this rule would fire for */
  key: string;
};

// cards still on the board
const onBoard = (projectId: string) =>
  and(
    eq(columnsTable.projectId, projectId),
    eq(columnsTable.isDeleted, false),
    eq(tasksTable.archived, false),
  );

const dayIn = (tz: string, at: unknown) =>
  sql`(${at} at time zone ${tz})::date`;

const candidates = (key: SQL<string>) =>
  db
    .select({ task: tasksTable, key })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId));

// the rule has not already run for this task and this key
const notFired = (ruleId: string, key: SQL<string>) =>
  sql`not exists (
    select 1 from ${automationFiredTable}
    where ${automationFiredTable.ruleId} = ${ruleId}
      and ${automationFiredTable.taskId} = ${tasksTable.id}
      and ${automationFiredTable.key} = ${key}
  )`;

/**
 * Open tasks due within `days` days and not past due, counted in the
 * workspace's days.
 */
export async function findDueSoon(
  rule: Pick<AutomationRuleRow, 'id' | 'projectId'>,
  days: number,
  tz: string,
  now: Date,
): Promise<DateCandidate[]> {
  const dueDay = dayIn(tz, tasksTable.dueDate);
  const today = dayIn(tz, sql`${now.toISOString()}::timestamptz`);
  const key = sql<string>`'soon:' || ${dueDay}::text`;
  return candidates(key)
    .where(
      and(
        onBoard(rule.projectId),
        notFired(rule.id, key),
        eq(columnsTable.isDone, false),
        isNotNull(tasksTable.dueDate),
        sql`${dueDay} - ${today} between 0 and ${days}`,
      ),
    )
    .limit(BATCH);
}

/**
 * Open tasks whose due day has ended. Only days from the rule's own first
 * day on: a new rule does not fire for everything that was already late.
 */
export async function findDuePassed(
  rule: Pick<AutomationRuleRow, 'id' | 'projectId' | 'createdAt'>,
  tz: string,
  now: Date,
): Promise<DateCandidate[]> {
  const dueDay = dayIn(tz, tasksTable.dueDate);
  const today = dayIn(tz, sql`${now.toISOString()}::timestamptz`);
  const since = dayIn(tz, sql`${rule.createdAt.toISOString()}::timestamptz`);
  const key = sql<string>`'passed:' || ${dueDay}::text`;
  return candidates(key)
    .where(
      and(
        onBoard(rule.projectId),
        notFired(rule.id, key),
        eq(columnsTable.isDone, false),
        isNotNull(tasksTable.dueDate),
        sql`${dueDay} < ${today}`,
        sql`${dueDay} >= ${since}`,
      ),
    )
    .limit(BATCH);
}

/**
 * Tasks that have sat in their column for `days` days: in the given column,
 * or else anywhere but Done. A task's stay starts when it last changed
 * column, or when it was made.
 */
export async function findIdle(
  rule: Pick<AutomationRuleRow, 'id' | 'projectId'>,
  days: number,
  columnId: string | null,
  now: Date,
): Promise<DateCandidate[]> {
  const since = sql`greatest(${tasksTable.createdAt}, coalesce((
    select max(${taskActivitiesTable.createdAt})
    from ${taskActivitiesTable}
    where ${taskActivitiesTable.taskId} = ${tasksTable.id}
      and ${taskActivitiesTable.type} = 'moved'
  ), ${tasksTable.createdAt}))`;
  const cutoff = new Date(now.getTime() - days * 86_400_000);
  const key = sql<string>`'idle:' || extract(epoch from ${since})::bigint::text`;
  return candidates(key)
    .where(
      and(
        onBoard(rule.projectId),
        notFired(rule.id, key),
        columnId
          ? eq(tasksTable.columnId, columnId)
          : eq(columnsTable.isDone, false),
        sql`${since} <= ${cutoff.toISOString()}::timestamptz`,
      ),
    )
    .limit(BATCH);
}
