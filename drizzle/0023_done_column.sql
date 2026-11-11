ALTER TABLE "columns" ADD COLUMN "is_done" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "completed_from_column_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_from_column_id_columns_id_fk" FOREIGN KEY ("completed_from_column_id") REFERENCES "public"."columns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "columns_one_done_per_project" ON "columns" USING btree ("project_id") WHERE "columns"."is_done" AND NOT "columns"."is_deleted";--> statement-breakpoint
-- Until now "done" meant "in the board's last column": keep that meaning
-- for every existing board by flagging its last column.
UPDATE "columns" c SET "is_done" = true
WHERE NOT c."is_deleted" AND c."id" = (
  SELECT o."id" FROM "columns" o
  WHERE o."project_id" = c."project_id" AND NOT o."is_deleted"
  ORDER BY o."order_fraction" COLLATE "C" DESC, o."id" DESC
  LIMIT 1
);--> statement-breakpoint
-- The real finish time was never recorded; the last change is the closest.
UPDATE "tasks" t SET "completed_at" = t."updated_at"
FROM "columns" c WHERE c."id" = t."column_id" AND c."is_done";--> statement-breakpoint
-- completed_at follows the column, whichever code path moves the task:
-- entering the Done column stamps it (and remembers where the task came
-- from), leaving clears it.
CREATE OR REPLACE FUNCTION tasks_sync_completion() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    IF (SELECT is_done FROM columns WHERE id = NEW.column_id) THEN
      IF NEW.completed_at IS NULL THEN
        NEW.completed_at := now();
        NEW.completed_from_column_id :=
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.column_id END;
      END IF;
    ELSE
      NEW.completed_at := NULL;
      NEW.completed_from_column_id := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER tasks_sync_completion
BEFORE INSERT OR UPDATE OF column_id ON "tasks"
FOR EACH ROW EXECUTE FUNCTION tasks_sync_completion();--> statement-breakpoint
-- Turning a column's Done flag on or off completes or reopens its tasks.
CREATE OR REPLACE FUNCTION columns_sync_completion() RETURNS trigger AS $$
BEGIN
  IF NEW.is_done IS DISTINCT FROM OLD.is_done THEN
    UPDATE tasks SET
      completed_at = CASE WHEN NEW.is_done THEN coalesce(completed_at, now()) END,
      completed_from_column_id =
        CASE WHEN NEW.is_done THEN completed_from_column_id END
    WHERE column_id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER columns_sync_completion
AFTER UPDATE OF is_done ON "columns"
FOR EACH ROW EXECUTE FUNCTION columns_sync_completion();
