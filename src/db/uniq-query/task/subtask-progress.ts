import { db } from '@/db';
import { subtasksTable } from '@/db/schema';
import { count, inArray, sql } from 'drizzle-orm';
import type { SubtaskProgress } from '@/types';

/** done/total subtasks for each task that has any, keyed by task id. */
export async function fetchSubtaskProgress(
  taskIds: string[],
): Promise<Record<string, SubtaskProgress>> {
  if (taskIds.length === 0) return {};
  const rows = await db
    .select({
      taskId: subtasksTable.taskId,
      total: count(),
      done: sql<number>`count(*) filter (where ${subtasksTable.completed})`.mapWith(
        Number,
      ),
    })
    .from(subtasksTable)
    .where(inArray(subtasksTable.taskId, taskIds))
    .groupBy(subtasksTable.taskId);
  return Object.fromEntries(
    rows.map(({ taskId, done, total }) => [taskId, { done, total }]),
  );
}
