import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tasksTable } from "./task.table";
import { usersTable } from "./user.table";

export const taskAssigneesTable = pgTable(
  "task_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskUserUnique: uniqueIndex("task_assignees_task_user_unique").on(table.taskId, table.userId),
  })
);
