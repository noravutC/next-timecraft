import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { taskCommentsTable } from "./task-comment.table";

export const commentAttachmentTypeEnum = pgEnum("comment_attachment_type", [
  "image",
  "video",
]);

export const taskCommentAttachmentsTable = pgTable(
  "task_comment_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => taskCommentsTable.id, { onDelete: "cascade" }),
    type: commentAttachmentTypeEnum("type").notNull(),
    storagePath: text("storage_path").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    orderIndex: integer("order_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    commentIdx: index("task_comment_attachments_comment_idx").on(
      table.commentId,
      table.orderIndex,
    ),
  }),
);
