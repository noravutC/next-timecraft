import { randomUUID } from 'crypto';
import { db } from '@/db';
import {
  columnsTable,
  subtasksTable,
  taskActivitiesTable,
  taskAssigneesTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from '@/db/schema';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import type { TaskRow } from '@/types';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

// fractional keys sort by bytes, not by the database's locale
const byteOrder = sql`${tasksTable.orderFraction} COLLATE "C"`;

/** The key that puts a card at the end of a column. */
export async function endOfColumn(columnId: string): Promise<string> {
  const [last] = await db
    .select({ orderFraction: tasksTable.orderFraction })
    .from(tasksTable)
    .where(eq(tasksTable.columnId, columnId))
    .orderBy(sql`${byteOrder} desc`)
    .limit(1);
  return generateFractionBetween(last?.orderFraction ?? null, null);
}

/** Changes a task's own fields: what a rule's simple steps do. */
export async function patchTask(
  taskId: string,
  patch: Partial<
    Pick<
      TaskRow,
      | 'columnId'
      | 'orderFraction'
      | 'priority'
      | 'dueDate'
      | 'tags'
      | 'archived'
      | 'archivedAt'
      | 'remindedAt'
    >
  >,
): Promise<TaskRow | null> {
  const [updated] = await db
    .update(tasksTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(tasksTable.id, taskId))
    .returning();
  return updated ?? null;
}

/** The people on a task, as the board shows them. */
export async function assigneesOf(taskId: string) {
  return db
    .select({
      userId: taskAssigneesTable.userId,
      fullName: usersTable.fullName,
      avatar: usersTable.avatar,
      email: usersTable.email,
    })
    .from(taskAssigneesTable)
    .innerJoin(usersTable, eq(taskAssigneesTable.userId, usersTable.id))
    .where(eq(taskAssigneesTable.taskId, taskId));
}

/** Adds one person to a task, keeping whoever is already on it. */
export async function addAssignee(
  taskId: string,
  userId: string,
): Promise<boolean> {
  const added = await db
    .insert(taskAssigneesTable)
    .values({ taskId, userId })
    .onConflictDoNothing()
    .returning({ userId: taskAssigneesTable.userId });
  return added.length > 0;
}

/** True when the task has subtasks and every one is ticked. */
export async function allSubtasksDone(taskId: string): Promise<boolean> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`(count(*) filter (where not ${subtasksTable.completed}))::int`,
    })
    .from(subtasksTable)
    .where(eq(subtasksTable.taskId, taskId));
  return Boolean(row && row.total > 0 && row.open === 0);
}

/** Who made the task, from its history; null when a rule did, or it is unknown. */
export async function creatorOf(taskId: string): Promise<string | null> {
  const [first] = await db
    .select({ actorId: taskActivitiesTable.actorId })
    .from(taskActivitiesTable)
    .where(
      and(
        eq(taskActivitiesTable.taskId, taskId),
        eq(taskActivitiesTable.type, 'created'),
      ),
    )
    .orderBy(asc(taskActivitiesTable.createdAt))
    .limit(1);
  return first?.actorId ?? null;
}

/** A comment from a rule, in the name of whoever set the rule up. */
export async function addComment(taskId: string, userId: string, body: string) {
  return db.transaction(async (tx) => {
    const [comment] = await tx
      .insert(taskCommentsTable)
      .values({ taskId, userId, body, mentions: [], clientId: randomUUID() })
      .returning();
    await tx
      .update(tasksTable)
      .set({
        commentCount: sql`${tasksTable.commentCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(tasksTable.id, taskId));
    const [author] = await tx
      .select({ fullName: usersTable.fullName, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    return {
      ...comment,
      authorName: author?.fullName ?? '',
      authorAvatar: author?.avatar ?? null,
      attachments: [],
      reactions: [],
    };
  });
}

/** The board each task is on, by task id; tasks that are gone are left out. */
export async function boardsOfTasks(
  taskIds: string[],
): Promise<Map<string, string>> {
  if (taskIds.length === 0) return new Map();
  const rows = await db
    .select({ taskId: tasksTable.id, projectId: columnsTable.projectId })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .where(inArray(tasksTable.id, [...new Set(taskIds)]));
  return new Map(rows.map((r) => [r.taskId, r.projectId]));
}
