import { db } from '@/db';
import { columnsTable, taskDependenciesTable, tasksTable } from '@/db/schema';
import type { BlockerRef, DependencyTask } from '@/types';
import { and, eq, inArray } from 'drizzle-orm';

const linkedTask = {
  id: tasksTable.id,
  title: tasksTable.title,
  columnId: tasksTable.columnId,
  archived: tasksTable.archived,
};

/** Blockers of each task, for the Blocked tag on cards. */
export async function fetchBlockerRefs(
  taskIds: string[],
): Promise<Record<string, BlockerRef[]>> {
  if (taskIds.length === 0) return {};
  const rows = await db
    .select({
      taskId: taskDependenciesTable.taskId,
      id: tasksTable.id,
      columnId: tasksTable.columnId,
      archived: tasksTable.archived,
    })
    .from(taskDependenciesTable)
    .innerJoin(
      tasksTable,
      eq(tasksTable.id, taskDependenciesTable.dependsOnTaskId),
    )
    .where(inArray(taskDependenciesTable.taskId, taskIds));
  const byTask: Record<string, BlockerRef[]> = {};
  for (const { taskId, ...ref } of rows) (byTask[taskId] ??= []).push(ref);
  return byTask;
}

/** What blocks a task, and what it blocks. */
export async function listTaskDependencies(taskId: string): Promise<{
  blockedBy: DependencyTask[];
  blocking: DependencyTask[];
}> {
  const [blockedBy, blocking] = await Promise.all([
    db
      .select(linkedTask)
      .from(taskDependenciesTable)
      .innerJoin(
        tasksTable,
        eq(tasksTable.id, taskDependenciesTable.dependsOnTaskId),
      )
      .where(eq(taskDependenciesTable.taskId, taskId))
      .orderBy(taskDependenciesTable.createdAt),
    db
      .select(linkedTask)
      .from(taskDependenciesTable)
      .innerJoin(tasksTable, eq(tasksTable.id, taskDependenciesTable.taskId))
      .where(eq(taskDependenciesTable.dependsOnTaskId, taskId))
      .orderBy(taskDependenciesTable.createdAt),
  ]);
  return { blockedBy, blocking };
}

/** The board a task is on, or null when it's gone. */
const boardOf = async (taskId: string) => {
  const [row] = await db
    .select({ projectId: columnsTable.projectId })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .where(eq(tasksTable.id, taskId));
  return row?.projectId ?? null;
};

/** Would `blockerId` (through its own blockers) wait on `taskId`? */
async function wouldLoop(taskId: string, blockerId: string): Promise<boolean> {
  const seen = new Set([blockerId]);
  let frontier = [blockerId];
  while (frontier.length > 0) {
    if (frontier.includes(taskId)) return true;
    const rows = await db
      .select({ next: taskDependenciesTable.dependsOnTaskId })
      .from(taskDependenciesTable)
      .where(inArray(taskDependenciesTable.taskId, frontier));
    frontier = rows.map((r) => r.next).filter((id) => !seen.has(id));
    frontier.forEach((id) => seen.add(id));
  }
  return false;
}

export type AddBlockerResult = 'added' | 'self' | 'other-board' | 'loop';

/** `taskId` waits on `blockerId`: same board only, and never in a circle. */
export async function addTaskDependency(
  taskId: string,
  blockerId: string,
  projectId: string,
): Promise<AddBlockerResult> {
  if (taskId === blockerId) return 'self';
  if ((await boardOf(blockerId)) !== projectId) return 'other-board';
  if (await wouldLoop(taskId, blockerId)) return 'loop';
  await db
    .insert(taskDependenciesTable)
    .values({ taskId, dependsOnTaskId: blockerId })
    .onConflictDoNothing();
  return 'added';
}

export async function removeTaskDependency(
  taskId: string,
  blockerId: string,
): Promise<void> {
  await db
    .delete(taskDependenciesTable)
    .where(
      and(
        eq(taskDependenciesTable.taskId, taskId),
        eq(taskDependenciesTable.dependsOnTaskId, blockerId),
      ),
    );
}
