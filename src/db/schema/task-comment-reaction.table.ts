import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { taskCommentsTable } from "./task-comment.table";
import { usersTable } from "./user.table";

export const taskCommentReactionsTable = pgTable(
  "task_comment_reactions",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => taskCommentsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.commentId, table.userId, table.emoji],
    }),
    commentIdx: index("task_comment_reactions_comment_idx").on(table.commentId),
  }),
);
