import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { jobStatusEnum, jobTypeEnum } from "./enums";
import { cronJobsTable } from "./cron-job.table";
import { usersTable } from "./user.table";

export const jobQueueTable = pgTable(
  "job_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cronJobId: uuid("cron_job_id").references(() => cronJobsTable.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    jobType: jobTypeEnum("job_type").notNull(),
    description: text("description"),
    payload: jsonb("payload"),
    status: jobStatusEnum("status").notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idempotencyKeyUnique: uniqueIndex("job_queue_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
  }),
);
