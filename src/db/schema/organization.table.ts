import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./user.table";

export const organizationsTable = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
