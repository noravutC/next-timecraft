import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizationMembershipRoleEnum } from "./enums";
import { organizationsTable } from "./organization.table";
import { usersTable } from "./user.table";

export const membershipsTable = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    role: organizationMembershipRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userOrganizationUnique: uniqueIndex("memberships_user_org_unique").on(
      table.userId,
      table.organizationId
    ),
  })
);
