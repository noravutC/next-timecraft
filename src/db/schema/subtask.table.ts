import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { tasksTable } from "./task.table";

export const subtasksTable = pgTable(
  "subtasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasksTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    completed: boolean("completed").notNull().default(false),
    orderFraction: text("order_fraction").notNull().default("0"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    taskOrderIdx: index("subtasks_task_order_idx").on(
      table.taskId,
      table.orderFraction,
    ),
  }),
);
