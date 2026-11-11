import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { taskPriorityLevelEnum } from "./enums";
import { columnsTable } from "./column.table";
import { usersTable } from "./user.table";

export const tasksTable = pgTable(
  "tasks",
  {
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
    // when and by whom it went to the archive; null while on the board
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    archivedBy: uuid("archived_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    // days before the due date to remind the assignees (0 = on the day);
    // null = no reminder. remindedAt marks it sent, until the date changes.
    remindDaysBefore: integer("remind_days_before"),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    estimatedHours: integer("estimated_hours").notNull().default(0),
    loggedHours: integer("logged_hours").notNull().default(0),
    // time spent, summed from every "Log time" (logged_hours is unused)
    loggedMinutes: integer("logged_minutes").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    // set while the task sits in its board's Done column, by the triggers
    // in migration 0023 (never written by the app). completedFromColumnId
    // is where it came from, so "Mark as not done" can put it back.
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedFromColumnId: uuid("completed_from_column_id").references(
      (): AnyPgColumn => columnsTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // a column's cards in board order: the board, its pages and its counts.
    // COLLATE "C" matches the queries (fractional indexes sort by byte)
    columnOrderIdx: index("tasks_column_order_idx").on(
      table.columnId,
      sql`${table.orderFraction} COLLATE "C"`,
      table.id,
    ),
    // search and the board's text filter use ILIKE '%words%'; trigram
    // indexes serve that as is, in any language (Thai has no word breaks)
    titleTrgm: index("tasks_title_trgm").using(
      "gin",
      sql`${table.title} gin_trgm_ops`,
    ),
    descriptionTrgm: index("tasks_description_trgm").using(
      "gin",
      sql`${table.description} gin_trgm_ops`,
    ),
    // the reminder job, every 5 minutes: only tasks still waiting for one
    reminderDueIdx: index("tasks_reminder_due_idx")
      .on(table.dueDate)
      .where(
        sql`${table.remindDaysBefore} IS NOT NULL AND ${table.remindedAt} IS NULL`,
      ),
  }),
);
