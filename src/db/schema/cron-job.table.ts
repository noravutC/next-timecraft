import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { jobTypeEnum } from "./enums";
import { organizationsTable } from "./organization.table";

export const cronJobsTable = pgTable(
  "cron_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(
      () => organizationsTable.id,
      { onDelete: "cascade" },
    ),
    name: text("name").notNull(),
    description: text("description"),
    cronExpression: text("cron_expression").notNull(),
    jobType: jobTypeEnum("job_type").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    lastStatus: text("last_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("cron_jobs_name_unique").on(table.name),
  }),
);
