import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { projectsTable } from "./project.table";
import { usersTable } from "./user.table";

export const columnsTable = pgTable(
  "columns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#CBD5E1"),
    wipLimit: integer("wip_limit").notNull().default(0),
    orderFraction: text("order_fraction").notNull().default("0"),
    // the board's Done column: cards in it count as finished. Triggers in
    // migration 0023 keep tasks.completed_at in step with it.
    isDone: boolean("is_done").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    purgeAt: timestamp("purge_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // every board load and permission check starts from the project
    projectIdx: index("columns_project_idx").on(table.projectId),
    // one Done column per board; a deleted one doesn't hold the slot
    oneDonePerProject: uniqueIndex("columns_one_done_per_project")
      .on(table.projectId)
      .where(sql`${table.isDone} AND NOT ${table.isDeleted}`),
  }),
);
