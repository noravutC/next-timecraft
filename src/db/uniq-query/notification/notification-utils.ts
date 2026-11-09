import { db } from "@/db";
import { notificationsTable, usersTable } from "@/db/schema";
import {
  wantsInApp,
  withPrefDefaults,
} from "@/helper/utils/notification-prefs";
import type { Notification, NotificationPayload } from "@/types";
import { and, count, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

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

const onBoard = (projectId: string) =>
  sql`${notificationsTable.payload}->>'projectId' = ${projectId}`;

export async function fetchNotificationsPage(args: {
  userId: string;
  cursor: string | null;
  limit: number;
  unreadOnly: boolean;
  /** only these kinds (the page's chips) */
  types?: Notification["type"][];
  /** only about this board */
  projectId?: string | null;
}): Promise<{
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const { userId, cursor, limit, unreadOnly } = args;
  const cur = decodeNotifCursor(cursor);

  const conds = [eq(notificationsTable.userId, userId)];
  if (unreadOnly) conds.push(isNull(notificationsTable.readAt));
  if (args.types) conds.push(inArray(notificationsTable.type, args.types));
  if (args.projectId) conds.push(onBoard(args.projectId));
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

/** Of these people, the ones who want this kind of notification in the app. */
export async function filterByInAppPrefs(
  userIds: string[],
  type: Notification["type"],
  executor: Pick<typeof db, "select"> = db,
): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await executor
    .select({ id: usersTable.id, prefs: usersTable.notificationPrefs })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));
  const wanting = new Set(
    rows
      .filter((row) => wantsInApp(withPrefDefaults(row.prefs), type))
      .map((row) => row.id),
  );
  return userIds.filter((id) => wanting.has(id));
}

/** Null when they turned this kind off in Settings › Notifications. */
export async function createNotification(args: {
  recipientId: string;
  type: Notification["type"];
  payload: NotificationPayload;
}): Promise<Notification | null> {
  const [created] = await createNotifications({
    recipientIds: [args.recipientId],
    type: args.type,
    payload: args.payload,
  });
  return created ?? null;
}

export async function createNotifications(args: {
  recipientIds: string[];
  type: Notification["type"];
  payload: NotificationPayload;
}): Promise<Notification[]> {
  const recipients = await filterByInAppPrefs(args.recipientIds, args.type);
  if (recipients.length === 0) return [];
  return db
    .insert(notificationsTable)
    .values(
      recipients.map((userId) => ({
        userId,
        type: args.type,
        payload: args.payload,
      })),
    )
    .returning();
}

/** Mark the user's own notifications read: the given ids, or all when ids is "all". */
export async function markNotificationsRead(
  userId: string,
  ids: string[] | "all",
): Promise<number> {
  if (ids !== "all" && ids.length === 0) return 0;
  const rows = await db
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.userId, userId),
        isNull(notificationsTable.readAt),
        ids === "all" ? undefined : inArray(notificationsTable.id, ids),
      ),
    )
    .returning({ id: notificationsTable.id });
  return rows.length;
}

/** How many of each kind the chips on the notifications page show. */
export async function countNotificationKinds(
  userId: string,
  projectId: string | null,
): Promise<{ type: Notification["type"]; unread: number; total: number }[]> {
  const rows = await db
    .select({
      type: notificationsTable.type,
      total: count(),
      unread: sql<number>`count(*) filter (where ${notificationsTable.readAt} is null)`,
    })
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        projectId ? onBoard(projectId) : undefined,
      ),
    )
    .groupBy(notificationsTable.type);
  return rows.map((r) => ({
    type: r.type,
    total: Number(r.total),
    unread: Number(r.unread),
  }));
}

/** Puts the user's own notifications back to unread. */
export async function markNotificationsUnread(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await db
    .update(notificationsTable)
    .set({ readAt: null })
    .where(
      and(
        eq(notificationsTable.userId, userId),
        inArray(notificationsTable.id, ids),
      ),
    )
    .returning({ id: notificationsTable.id });
  return rows.length;
}

/** Dismisses the user's own notifications. */
export async function deleteNotifications(
  userId: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await db
    .delete(notificationsTable)
    .where(
      and(
        eq(notificationsTable.userId, userId),
        inArray(notificationsTable.id, ids),
      ),
    )
    .returning({ id: notificationsTable.id });
  return rows.length;
}
