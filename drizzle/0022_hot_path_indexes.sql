-- gin_trgm_ops below comes from pg_trgm (drizzle-kit does not emit extensions)
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "memberships_organization_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "projects_organization_idx" ON "projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_members_user_idx" ON "project_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "columns_project_idx" ON "columns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_column_order_idx" ON "tasks" USING btree ("column_id","order_fraction" COLLATE "C","id");--> statement-breakpoint
CREATE INDEX "tasks_title_trgm" ON "tasks" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tasks_description_trgm" ON "tasks" USING gin ("description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tasks_reminder_due_idx" ON "tasks" USING btree ("due_date") WHERE "tasks"."remind_days_before" IS NOT NULL AND "tasks"."reminded_at" IS NULL;--> statement-breakpoint
CREATE INDEX "task_assignees_user_idx" ON "task_assignees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_dependencies_depends_on_idx" ON "task_dependencies" USING btree ("depends_on_task_id");--> statement-breakpoint
CREATE INDEX "task_comments_body_trgm" ON "task_comments" USING gin ("body" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "job_queue_pending_idx" ON "job_queue" USING btree ("scheduled_at") WHERE "job_queue"."status" = 'pending';