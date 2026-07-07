import { db } from "@/db";
import { tasksTable } from "@/db/schema";
import type { TaskRow } from "@/types";
import { inArray } from "drizzle-orm";

export async function getTasksByIds(taskIds: string[]): Promise<TaskRow[]> {
  if (taskIds.length === 0) return [];
  return db.select().from(tasksTable).where(inArray(tasksTable.id, taskIds));
}
