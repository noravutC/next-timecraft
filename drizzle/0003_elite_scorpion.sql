CREATE TYPE "public"."notification_type" AS ENUM('comment_mention', 'comment_reply');--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"mentions" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
	"client_id" text,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_read_state" (
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"last_read_comment_id" uuid,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_read_state_user_id_task_id_pk" PRIMARY KEY("user_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "comment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_read_state" ADD CONSTRAINT "comment_read_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_read_state" ADD CONSTRAINT "comment_read_state_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_read_state" ADD CONSTRAINT "comment_read_state_last_read_comment_id_task_comments_id_fk" FOREIGN KEY ("last_read_comment_id") REFERENCES "public"."task_comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_comments_task_created_idx" ON "task_comments" USING btree ("task_id","created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "task_comments_mentions_gin" ON "task_comments" USING gin ("mentions");--> statement-breakpoint
CREATE UNIQUE INDEX "task_comments_client_id_unique" ON "task_comments" USING btree ("client_id") WHERE "task_comments"."client_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "comment_read_state_user_read_idx" ON "comment_read_state" USING btree ("user_id","last_read_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST) WHERE "notifications"."read_at" IS NULL;