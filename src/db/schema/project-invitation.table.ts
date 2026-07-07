import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { projectMembershipRoleEnum } from "./enums";
import { projectsTable } from "./project.table";
import { usersTable } from "./user.table";

// คำเชิญเข้าบอร์ดแบบ token — สถานะ derive จาก timestamps:
// pending = ไม่มี acceptedAt/revokedAt และ expiresAt ยังไม่ถึง
export const projectInvitationsTable = pgTable(
  "project_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectsTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: projectMembershipRoleEnum("role").notNull().default("viewer"),
    token: text("token").notNull(),
    invitedBy: uuid("invited_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex("project_invitations_token_unique").on(
      table.token,
    ),
    projectEmailIdx: index("project_invitations_project_email_idx").on(
      table.projectId,
      table.email,
    ),
  }),
);
