import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { taskPriorityLevelEnum } from "./enums";
import { columnsTable } from "./column.table";

export const tasksTable = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  columnId: uuid("column_id")
    .notNull()
    .references(() => columnsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: taskPriorityLevelEnum("priority").notNull().default("medium"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  orderFraction: text("order_fraction").notNull().default("0"),
  archived: boolean("archived").notNull().default(false),
  estimatedHours: integer("estimated_hours").notNull().default(0),
  loggedHours: integer("logged_hours").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
