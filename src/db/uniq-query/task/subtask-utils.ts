import { db } from "@/db";
import { columnsTable, subtasksTable, tasksTable } from "@/db/schema";
import type { Subtask } from "@/types";
import { asc, eq } from "drizzle-orm";

export async function getSubtaskTaskLink(subtaskId: string) {
  const [row] = await db
    .select({
      subtaskId: subtasksTable.id,
      taskId: subtasksTable.taskId,
      projectId: columnsTable.projectId,
    })
    .from(subtasksTable)
    .innerJoin(tasksTable, eq(subtasksTable.taskId, tasksTable.id))
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(eq(subtasksTable.id, subtaskId))
    .limit(1);
  return row ?? null;
}

export async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  return db
    .select()
    .from(subtasksTable)
    .where(eq(subtasksTable.taskId, taskId))
    .orderBy(asc(subtasksTable.orderFraction), asc(subtasksTable.createdAt));
}
