import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { tasksTable } from "./task.table";
import { usersTable } from "./user.table";

export const taskCommentsTable = pgTable(
  "task_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    mentions: uuid("mentions")
      .array()
      .notNull()
      .default(sql`ARRAY[]::uuid[]`),
    clientId: text("client_id"),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    taskCreatedIdx: index("task_comments_task_created_idx").on(
      table.taskId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    mentionsGin: index("task_comments_mentions_gin").using(
      "gin",
      table.mentions,
    ),
    clientIdUnique: uniqueIndex("task_comments_client_id_unique")
      .on(table.clientId)
      .where(sql`${table.clientId} IS NOT NULL`),
  }),
);
