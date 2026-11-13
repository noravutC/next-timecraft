import { db } from "@/db";
import { tasksTable } from "@/db/schema";
import type { TaskRow } from "@/types";
import { inArray } from "drizzle-orm";

export async function getTasksByIds(taskIds: string[]): Promise<TaskRow[]> {
  if (taskIds.length === 0) return [];
  return db.select().from(tasksTable).where(inArray(tasksTable.id, taskIds));
}

/**
 * The same tasks, with the ones a rule went on to change read again: a
 * route hands back what is in the database now, not what it wrote.
 */
export async function refreshTasks(
  rows: TaskRow[],
  changedIds: string[],
): Promise<TaskRow[]> {
  const stale = rows.filter((row) => changedIds.includes(row.id));
  if (stale.length === 0) return rows;
  const fresh = new Map(
    (await getTasksByIds(stale.map((row) => row.id))).map((t) => [t.id, t]),
  );
  return rows.map((row) => fresh.get(row.id) ?? row);
}
