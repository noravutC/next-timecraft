import { db } from "@/db";
import {
  columnsTable,
  commentReadStateTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import type { TaskCommentWithAuthor } from "@/types";
import {
  and,
  count,
  desc,
  eq,
  gt,
  isNull,
  lt,
  or,
} from "drizzle-orm";

type CursorParts = { createdAt: Date; id: string };

export function encodeCursor(c: CursorParts): string {
  return Buffer.from(`${c.createdAt.toISOString()}|${c.id}`).toString(
    "base64url",
  );
}

export function decodeCursor(raw: string | null): CursorParts | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const [iso, id] = decoded.split("|");
    if (!iso || !id) return null;
    return { createdAt: new Date(iso), id };
  } catch {
    return null;
  }
}

export async function getTaskProjectLink(taskId: string) {
  const [row] = await db
    .select({
      taskId: tasksTable.id,
      projectId: columnsTable.projectId,
      taskTitle: tasksTable.title,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(eq(tasksTable.id, taskId))
    .limit(1);
  return row ?? null;
}

export async function getCommentLink(commentId: string) {
  const [row] = await db
    .select({
      commentId: taskCommentsTable.id,
      taskId: taskCommentsTable.taskId,
      authorId: taskCommentsTable.userId,
      projectId: columnsTable.projectId,
    })
    .from(taskCommentsTable)
    .innerJoin(tasksTable, eq(taskCommentsTable.taskId, tasksTable.id))
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(eq(taskCommentsTable.id, commentId))
    .limit(1);
  return row ?? null;
}

export async function fetchCommentsPage(args: {
  taskId: string;
  cursor: string | null;
  limit: number;
}): Promise<{
  items: TaskCommentWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const { taskId, cursor, limit } = args;
  const cur = decodeCursor(cursor);

  const overFetch = limit + 1;
  const conds = [
    eq(taskCommentsTable.taskId, taskId),
    isNull(taskCommentsTable.deletedAt),
  ];
  if (cur) {
    conds.push(
      or(
        lt(taskCommentsTable.createdAt, cur.createdAt),
        and(
          eq(taskCommentsTable.createdAt, cur.createdAt),
          lt(taskCommentsTable.id, cur.id),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: taskCommentsTable.id,
      taskId: taskCommentsTable.taskId,
      userId: taskCommentsTable.userId,
      body: taskCommentsTable.body,
      mentions: taskCommentsTable.mentions,
      clientId: taskCommentsTable.clientId,
      editedAt: taskCommentsTable.editedAt,
      deletedAt: taskCommentsTable.deletedAt,
      createdAt: taskCommentsTable.createdAt,
      updatedAt: taskCommentsTable.updatedAt,
      authorName: usersTable.fullName,
      authorAvatar: usersTable.avatar,
    })
    .from(taskCommentsTable)
    .innerJoin(usersTable, eq(taskCommentsTable.userId, usersTable.id))
    .where(and(...conds))
    .orderBy(desc(taskCommentsTable.createdAt), desc(taskCommentsTable.id))
    .limit(overFetch);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const last = trimmed[trimmed.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ createdAt: last.createdAt, id: last.id })
      : null;

  return { items: trimmed, nextCursor, hasMore };
}

export async function countUnreadComments(args: {
  userId: string;
  taskId: string;
}): Promise<number> {
  const [readState] = await db
    .select({ lastReadAt: commentReadStateTable.lastReadAt })
    .from(commentReadStateTable)
    .where(
      and(
        eq(commentReadStateTable.userId, args.userId),
        eq(commentReadStateTable.taskId, args.taskId),
      ),
    )
    .limit(1);

  const conds = [
    eq(taskCommentsTable.taskId, args.taskId),
    isNull(taskCommentsTable.deletedAt),
  ];
  if (readState) {
    conds.push(gt(taskCommentsTable.createdAt, readState.lastReadAt));
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(taskCommentsTable)
    .where(and(...conds));
  return Number(value);
}
