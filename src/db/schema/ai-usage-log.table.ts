import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { aiProviderEnum, aiUsageStatusEnum } from "./enums";
import { projectsTable } from "./project.table";
import { usersTable } from "./user.table";

export const aiUsageLogsTable = pgTable("ai_usage_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projectsTable.id, {
    onDelete: "set null",
  }),
  provider: aiProviderEnum("provider").notNull(),
  model: text("model").notNull(),
  feature: text("feature").notNull().default("task-breakdown"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  taskCount: integer("task_count").notNull().default(0),
  status: aiUsageStatusEnum("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
