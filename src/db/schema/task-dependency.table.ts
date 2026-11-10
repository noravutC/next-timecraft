import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { tasksTable } from "./task.table";

export const taskDependenciesTable = pgTable(
  "task_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    dependsOnTaskId: uuid("depends_on_task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    dependencyUnique: uniqueIndex(
      "task_dependencies_task_depends_on_unique",
    ).on(table.taskId, table.dependsOnTaskId),
    // "what does this task block": the unique index leads with task_id
    dependsOnIdx: index("task_dependencies_depends_on_idx").on(
      table.dependsOnTaskId,
    ),
  }),
);
