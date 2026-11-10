import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { projectMemberSourceEnum, projectMembershipRoleEnum } from "./enums";
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
    source: projectMemberSourceEnum("source").notNull().default("direct"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectUserUnique: uniqueIndex("project_members_project_user_unique").on(
      table.projectId,
      table.userId,
    ),
    // "the boards I'm on": search, My tasks, the board list
    userIdx: index("project_members_user_idx").on(table.userId),
  }),
);
