ALTER TYPE "public"."comment_attachment_type" ADD VALUE 'file';--> statement-breakpoint
ALTER TABLE "task_comment_attachments" ADD COLUMN "file_name" text;