import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user.table";

export const notificationTypeEnum = pgEnum("notification_type", [
  "comment_mention",
  "comment_reply",
  "board_invite",
  "workspace_invite",
  "member_removed",
  "task_assigned",
  "role_changed",
  "invite_accepted",
]);

export type CommentNotificationPayload = {
  taskId: string;
  commentId: string;
  projectId: string;
  actorUserId: string;
  actorName: string;
  taskTitle: string;
  projectName: string;
  snippet: string;
};

export type BoardInviteNotificationPayload = {
  projectId: string;
  projectName: string;
  actorUserId: string;
  actorName: string;
  role: string;
  token: string;
};

export type WorkspaceInviteNotificationPayload = {
  organizationId: string;
  organizationName: string;
  actorUserId: string;
  actorName: string;
  role: string;
  token: string;
};

export type MemberRemovedNotificationPayload = {
  projectId: string;
  projectName: string;
  actorUserId: string;
  actorName: string;
};

export type TaskAssignedNotificationPayload = {
  taskId: string;
  projectId: string;
  taskTitle: string;
  projectName: string;
  actorUserId: string;
  actorName: string;
};

export type RoleChangedNotificationPayload = {
  projectId: string;
  projectName: string;
  actorUserId: string;
  actorName: string;
  role: string;
};

// someone joined through an invitation you sent: to a board or a workspace
export type InviteAcceptedNotificationPayload = {
  projectId?: string;
  projectName?: string;
  organizationId?: string;
  organizationName?: string;
  actorUserId: string;
  actorName: string;
};

export type NotificationPayload =
  | CommentNotificationPayload
  | BoardInviteNotificationPayload
  | WorkspaceInviteNotificationPayload
  | MemberRemovedNotificationPayload
  | TaskAssignedNotificationPayload
  | RoleChangedNotificationPayload
  | InviteAcceptedNotificationPayload;

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    payload: jsonb("payload").$type<NotificationPayload>().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    userUnreadIdx: index("notifications_user_unread_idx")
      .on(table.userId, table.createdAt.desc())
      .where(sql`${table.readAt} IS NULL`),
  }),
);
