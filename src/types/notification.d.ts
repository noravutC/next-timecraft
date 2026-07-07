import type { InferSelectModel } from "drizzle-orm";
import type { notificationsTable } from "@/db/schema";
export type {
  BoardInviteNotificationPayload,
  CommentNotificationPayload,
  MemberRemovedNotificationPayload,
  NotificationPayload,
  TaskAssignedNotificationPayload,
} from "@/db/schema/notification.table";

export type NotificationRow = InferSelectModel<typeof notificationsTable>;
export type Notification = NotificationRow;

export interface NotificationsPage {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}
