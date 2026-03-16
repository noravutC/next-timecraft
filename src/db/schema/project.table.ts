// db/schema/project.table.ts
import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizationsTable } from "./organization.table";
import { usersTable } from "./user.table";

export const projectsTable = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(
    () => organizationsTable.id,
    {
      onDelete: "set null",
    },
  ),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  archived: boolean("archived").notNull().default(false),
  tags: text("tags")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
