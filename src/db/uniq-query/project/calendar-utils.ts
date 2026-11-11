import { randomBytes } from 'node:crypto';
import { db } from '@/db';
import {
  calendarFeedsTable,
  columnsTable,
  organizationsTable,
  projectsTable,
  tasksTable,
} from '@/db/schema';
import { taskFilterConditions } from '@/db/uniq-query/task/task-filter';
import type { TaskFilter, TaskRow } from '@/types';
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  ne,
} from 'drizzle-orm';

export const UNDATED_LIMIT = 100;

// live tasks on the board: active columns, not archived
const onBoard = (projectId: string) =>
  and(
    inArray(
      tasksTable.columnId,
      db
        .select({ id: columnsTable.id })
        .from(columnsTable)
        .where(
          and(
            eq(columnsTable.projectId, projectId),
            eq(columnsTable.isDeleted, false),
          ),
        ),
    ),
    eq(tasksTable.archived, false),
  );

/**
 * What the calendar shows for one stretch of days: the tasks due in it,
 * and the first undated ones for the side panel (all of them counted).
 */
export async function listCalendarTasks(args: {
  projectId: string;
  userId: string;
  from: Date;
  to: Date;
  filter?: TaskFilter;
  /** the Done column: finished work stays out of "No due date" */
  hideUndatedIn?: string;
}): Promise<{ dated: TaskRow[]; undated: TaskRow[]; undatedTotal: number }> {
  const filters = taskFilterConditions(args.filter, args.userId);
  const undatedWhere = and(
    onBoard(args.projectId),
    isNull(tasksTable.dueDate),
    args.hideUndatedIn
      ? ne(tasksTable.columnId, args.hideUndatedIn)
      : undefined,
    ...filters,
  );
  const [dated, undated, [total]] = await Promise.all([
    db
      .select(getTableColumns(tasksTable))
      .from(tasksTable)
      .where(
        and(
          onBoard(args.projectId),
          gte(tasksTable.dueDate, args.from),
          lt(tasksTable.dueDate, args.to),
          ...filters,
        ),
      )
      .orderBy(asc(tasksTable.dueDate), asc(tasksTable.createdAt)),
    db
      .select(getTableColumns(tasksTable))
      .from(tasksTable)
      .where(undatedWhere)
      .orderBy(asc(tasksTable.createdAt))
      .limit(UNDATED_LIMIT),
    db.select({ n: count() }).from(tasksTable).where(undatedWhere),
  ]);
  return { dated, undated, undatedTotal: total?.n ?? 0 };
}

const newToken = () => randomBytes(24).toString('base64url');

/** Your feed link for a board, made the first time you ask. */
export async function getOrCreateCalendarFeed(
  userId: string,
  projectId: string,
): Promise<string> {
  const [row] = await db
    .insert(calendarFeedsTable)
    .values({ userId, projectId, token: newToken() })
    .onConflictDoNothing({
      target: [calendarFeedsTable.userId, calendarFeedsTable.projectId],
    })
    .returning({ token: calendarFeedsTable.token });
  if (row) return row.token;
  const [existing] = await db
    .select({ token: calendarFeedsTable.token })
    .from(calendarFeedsTable)
    .where(
      and(
        eq(calendarFeedsTable.userId, userId),
        eq(calendarFeedsTable.projectId, projectId),
      ),
    );
  return existing.token;
}

/** A new token for your link; the old one stops working. */
export async function resetCalendarFeed(
  userId: string,
  projectId: string,
): Promise<string> {
  const token = newToken();
  await db
    .insert(calendarFeedsTable)
    .values({ userId, projectId, token })
    .onConflictDoUpdate({
      target: [calendarFeedsTable.userId, calendarFeedsTable.projectId],
      set: { token, createdAt: new Date() },
    });
  return token;
}

export async function findCalendarFeed(token: string) {
  const [row] = await db
    .select({
      userId: calendarFeedsTable.userId,
      projectId: calendarFeedsTable.projectId,
    })
    .from(calendarFeedsTable)
    .where(eq(calendarFeedsTable.token, token));
  return row ?? null;
}

/** Everything a feed needs: the board, its time zone, its dated tasks. */
export async function getFeedContents(projectId: string) {
  const [board] = await db
    .select({
      name: projectsTable.name,
      timeZone: organizationsTable.timeZone,
    })
    .from(projectsTable)
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    )
    .where(eq(projectsTable.id, projectId));
  if (!board) return null;
  const tasks = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      dueDate: tasksTable.dueDate,
      columnName: columnsTable.name,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .where(and(onBoard(projectId), isNotNull(tasksTable.dueDate)))
    .orderBy(asc(tasksTable.dueDate));
  return { name: board.name, timeZone: board.timeZone ?? 'UTC', tasks };
}
