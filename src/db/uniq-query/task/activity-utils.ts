import { db } from '@/db';
import { columnsTable, taskActivitiesTable, usersTable } from '@/db/schema';
import {
  decodeCursor,
  encodeCursor,
} from '@/db/uniq-query/comment/comment-utils';
import { logger } from '@/lib/logger';
import type {
  ActivityColumnRef,
  TaskActivityEntry,
  TaskActivityPage,
  TaskActivityWithActor,
} from '@/types';
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';

export const ACTIVITY_PAGE_SIZE = 50;

/** Columns as they are now, for snapshotting into history entries. */
export async function getColumnRefs(
  columnIds: string[],
): Promise<Map<string, ActivityColumnRef>> {
  if (columnIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: columnsTable.id,
      name: columnsTable.name,
      color: columnsTable.color,
    })
    .from(columnsTable)
    .where(inArray(columnsTable.id, [...new Set(columnIds)]));
  return new Map(rows.map((r) => [r.id, r]));
}

/**
 * Appends history entries. History is a side record: a failure here is
 * logged and never fails the change that produced it.
 */
export async function recordTaskActivities(
  actorId: string,
  items: { taskId: string; entry: TaskActivityEntry }[],
): Promise<void> {
  if (items.length === 0) return;
  try {
    await db.insert(taskActivitiesTable).values(
      items.map(({ taskId, entry }) => ({
        taskId,
        actorId,
        type: entry.type,
        data: entry.data,
      })),
    );
  } catch (err) {
    logger.error(
      { err, count: items.length },
      'Failed to record task activity',
    );
  }
}

/** A task's history, newest first, a page at a time. */
export async function listTaskActivities(
  taskId: string,
  cursor: string | null,
  limit = ACTIVITY_PAGE_SIZE,
): Promise<TaskActivityPage> {
  const after = decodeCursor(cursor);
  const rows = await db
    .select({
      id: taskActivitiesTable.id,
      taskId: taskActivitiesTable.taskId,
      type: taskActivitiesTable.type,
      data: taskActivitiesTable.data,
      createdAt: taskActivitiesTable.createdAt,
      actorId: usersTable.id,
      actorName: usersTable.fullName,
      actorAvatar: usersTable.avatar,
    })
    .from(taskActivitiesTable)
    .leftJoin(usersTable, eq(usersTable.id, taskActivitiesTable.actorId))
    .where(
      and(
        eq(taskActivitiesTable.taskId, taskId),
        after
          ? or(
              lt(taskActivitiesTable.createdAt, after.createdAt),
              and(
                eq(taskActivitiesTable.createdAt, after.createdAt),
                lt(taskActivitiesTable.id, after.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(taskActivitiesTable.createdAt), desc(taskActivitiesTable.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    // type and data were written together, so they pair up as one entry
    items: page.map(
      ({ actorId, actorName, actorAvatar, ...row }) =>
        ({
          ...row,
          actor: actorId
            ? { id: actorId, fullName: actorName ?? '', avatar: actorAvatar }
            : null,
        }) as TaskActivityWithActor,
    ),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}
