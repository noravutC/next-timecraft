ALTER TYPE "public"."notification_type" ADD VALUE 'due_reminder';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "remind_days_before" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "reminded_at" timestamp with time zone;