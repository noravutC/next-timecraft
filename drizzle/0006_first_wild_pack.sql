CREATE TYPE "public"."comment_attachment_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "task_comment_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"type" "comment_attachment_type" NOT NULL,
	"storage_path" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comment_reactions" (
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_comment_reactions_comment_id_user_id_emoji_pk" PRIMARY KEY("comment_id","user_id","emoji")
);
--> statement-breakpoint
ALTER TABLE "task_comment_attachments" ADD CONSTRAINT "task_comment_attachments_comment_id_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comment_reactions" ADD CONSTRAINT "task_comment_reactions_comment_id_task_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."task_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comment_reactions" ADD CONSTRAINT "task_comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_comment_attachments_comment_idx" ON "task_comment_attachments" USING btree ("comment_id","order_index");--> statement-breakpoint
CREATE INDEX "task_comment_reactions_comment_idx" ON "task_comment_reactions" USING btree ("comment_id");