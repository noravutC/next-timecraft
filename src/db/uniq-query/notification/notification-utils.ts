import { db } from "@/db";
import { notificationsTable } from "@/db/schema";
import type { Notification } from "@/types";
import { and, count, desc, eq, isNull, lt } from "drizzle-orm";

type CursorParts = { createdAt: Date; id: string };

export function encodeNotifCursor(c: CursorParts): string {
  return Buffer.from(`${c.createdAt.toISOString()}|${c.id}`).toString(
    "base64url",
  );
}

export function decodeNotifCursor(raw: string | null): CursorParts | null {
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

export async function fetchNotificationsPage(args: {
  userId: string;
  cursor: string | null;
  limit: number;
  unreadOnly: boolean;
}): Promise<{
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const { userId, cursor, limit, unreadOnly } = args;
  const cur = decodeNotifCursor(cursor);

  const conds = [eq(notificationsTable.userId, userId)];
  if (unreadOnly) conds.push(isNull(notificationsTable.readAt));
  if (cur) conds.push(lt(notificationsTable.createdAt, cur.createdAt));

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(...conds))
    .orderBy(desc(notificationsTable.createdAt), desc(notificationsTable.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  const last = trimmed[trimmed.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeNotifCursor({ createdAt: last.createdAt, id: last.id })
      : null;

  return { items: trimmed, nextCursor, hasMore };
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        isNull(notificationsTable.readAt),
      ),
    );
  return Number(value);
}
