import { db } from "@/db";
import {
  columnsTable,
  commentReadStateTable,
  taskCommentAttachmentsTable,
  taskCommentReactionsTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import type {
  ReactionSummary,
  TaskCommentAttachment,
  TaskCommentWithAuthor,
} from "@/types";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
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

  const ids = trimmed.map((c) => c.id);
  const [attachmentsByComment, reactionsByComment] = await Promise.all([
    fetchAttachmentsForComments(ids),
    fetchReactionsForComments(ids),
  ]);

  const items: TaskCommentWithAuthor[] = trimmed.map((c) => ({
    ...c,
    attachments: attachmentsByComment[c.id] ?? [],
    reactions: reactionsByComment[c.id] ?? [],
  }));

  return { items, nextCursor, hasMore };
}

export async function fetchAttachmentsForComments(
  commentIds: string[],
): Promise<Record<string, TaskCommentAttachment[]>> {
  if (commentIds.length === 0) return {};
  const rows = await db
    .select()
    .from(taskCommentAttachmentsTable)
    .where(inArray(taskCommentAttachmentsTable.commentId, commentIds))
    .orderBy(
      asc(taskCommentAttachmentsTable.commentId),
      asc(taskCommentAttachmentsTable.orderIndex),
    );
  const out: Record<string, TaskCommentAttachment[]> = {};
  for (const r of rows) {
    (out[r.commentId] ??= []).push(r);
  }
  return out;
}

export async function fetchReactionsForComments(
  commentIds: string[],
): Promise<Record<string, ReactionSummary[]>> {
  if (commentIds.length === 0) return {};
  const rows = await db
    .select({
      commentId: taskCommentReactionsTable.commentId,
      emoji: taskCommentReactionsTable.emoji,
      userId: taskCommentReactionsTable.userId,
    })
    .from(taskCommentReactionsTable)
    .where(inArray(taskCommentReactionsTable.commentId, commentIds));

  const acc: Record<string, Map<string, string[]>> = {};
  for (const r of rows) {
    const map = (acc[r.commentId] ??= new Map());
    const list = map.get(r.emoji) ?? [];
    list.push(r.userId);
    map.set(r.emoji, list);
  }
  const out: Record<string, ReactionSummary[]> = {};
  for (const [cid, map] of Object.entries(acc)) {
    out[cid] = Array.from(map.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
    }));
  }
  return out;
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
