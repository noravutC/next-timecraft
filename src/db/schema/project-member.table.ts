import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { projectMembershipRoleEnum } from "./enums";
import { projectsTable } from "./project.table";
import { usersTable } from "./user.table";

export const projectMembersTable = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: projectMembershipRoleEnum("role").notNull().default("viewer"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectUserUnique: uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId
    ),
  })
);
