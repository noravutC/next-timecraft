import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projectsTable } from "./project.table";

export const columnsTable = pgTable("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#CBD5E1"),
  wipLimit: integer("wip_limit").notNull().default(0),
  orderFraction: text("order_fraction").notNull().default("0"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  purgeAt: timestamp("purge_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
