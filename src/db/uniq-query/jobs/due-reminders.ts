import { db } from '@/db';
import {
  columnsTable,
  organizationsTable,
  projectsTable,
  taskAssigneesTable,
  tasksTable,
} from '@/db/schema';
import { and, eq, gt, inArray, isNotNull, isNull, sql } from 'drizzle-orm';

/**
 * Tasks with a reminder that hasn't gone out, due from yesterday on (a
 * reminder is never later than its due day), with their board and the
 * workspace's time zone.
 */
export async function findReminderCandidates(now: Date) {
  return db
    .select({
      taskId: tasksTable.id,
      title: tasksTable.title,
      dueDate: tasksTable.dueDate,
      remindDaysBefore: tasksTable.remindDaysBefore,
      projectId: projectsTable.id,
      projectName: projectsTable.name,
      timeZone: sql<string>`coalesce(${organizationsTable.timeZone}, 'UTC')`,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .innerJoin(projectsTable, eq(projectsTable.id, columnsTable.projectId))
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    )
    .where(
      and(
        isNotNull(tasksTable.dueDate),
        isNotNull(tasksTable.remindDaysBefore),
        isNull(tasksTable.remindedAt),
        eq(tasksTable.archived, false),
        eq(columnsTable.isDeleted, false),
        eq(projectsTable.archived, false),
        gt(
          tasksTable.dueDate,
          new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        ),
      ),
    );
}

/** Each task's assignees. */
export async function assigneesByTask(
  taskIds: string[],
): Promise<Map<string, string[]>> {
  if (taskIds.length === 0) return new Map();
  const rows = await db
    .select({
      taskId: taskAssigneesTable.taskId,
      userId: taskAssigneesTable.userId,
    })
    .from(taskAssigneesTable)
    .where(inArray(taskAssigneesTable.taskId, taskIds));
  const out = new Map<string, string[]>();
  for (const row of rows)
    out.set(row.taskId, [...(out.get(row.taskId) ?? []), row.userId]);
  return out;
}

/** Marks reminders sent, so the next run skips them. */
export async function markReminded(taskIds: string[], now: Date) {
  if (taskIds.length === 0) return;
  await db
    .update(tasksTable)
    .set({ remindedAt: now })
    .where(inArray(tasksTable.id, taskIds));
}
