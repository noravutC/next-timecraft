import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { tasksTable } from "./task.table";
import { taskCommentsTable } from "./task-comment.table";
import { usersTable } from "./user.table";

export const commentReadStateTable = pgTable(
  "comment_read_state",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    lastReadCommentId: uuid("last_read_comment_id").references(
      () => taskCommentsTable.id,
      { onDelete: "set null" },
    ),
    lastReadAt: timestamp("last_read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.taskId] }),
    userReadIdx: index("comment_read_state_user_read_idx").on(
      table.userId,
      table.lastReadAt.desc(),
    ),
  }),
);
