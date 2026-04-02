import { pgEnum } from "drizzle-orm/pg-core";

export const organizationMembershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "guest",
]);

export const projectMembershipRoleEnum = pgEnum("project_member_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const taskPriorityLevelEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const jobTypeEnum = pgEnum("job_type", [
  "send_email",
  "send_notification",
  "expire_success",
  "cleanup_columns",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);
