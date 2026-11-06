ALTER TYPE "public"."notification_type" ADD VALUE 'role_changed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'invite_accepted';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL;