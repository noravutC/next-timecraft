import { db } from '@/db';
import {
  columnsTable,
  projectsTable,
  subtasksTable,
  taskAssigneesTable,
  tasksTable,
} from '@/db/schema';
import { generateFractionBetween } from '@/helper/utils/fraction-string-indexing';
import type { TaskRow } from '@/types';
import { and, eq, sql } from 'drizzle-orm';

// fractional keys sort by bytes, not by the database's locale
const byteOrder = sql`${tasksTable.orderFraction} COLLATE "C"`;

/**
 * Copies a task right under itself: its fields, subtasks and assignees
 * (comments and history stay with the original). Null when it's gone.
 */
export async function duplicateTask(
  taskId: string,
): Promise<{ task: TaskRow; projectId: string } | null> {
  return db.transaction(async (tx) => {
    const [source] = await tx
      .select({ task: tasksTable, projectId: columnsTable.projectId })
      .from(tasksTable)
      .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
      .where(and(eq(tasksTable.id, taskId), eq(columnsTable.isDeleted, false)))
      .limit(1);
    if (!source) return null;
    const original = source.task;

    const [next] = await tx
      .select({ orderFraction: tasksTable.orderFraction })
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.columnId, original.columnId),
          sql`${byteOrder} > ${original.orderFraction}`,
        ),
      )
      .orderBy(byteOrder)
      .limit(1);

    const [copy] = await tx
      .insert(tasksTable)
      .values({
        columnId: original.columnId,
        title: original.title,
        description: original.description,
        priority: original.priority,
        dueDate: original.dueDate,
        tags: original.tags,
        estimatedHours: original.estimatedHours,
        orderFraction: generateFractionBetween(
          original.orderFraction,
          next?.orderFraction ?? null,
        ),
      })
      .returning();

    const subtasks = await tx
      .select()
      .from(subtasksTable)
      .where(eq(subtasksTable.taskId, original.id));
    if (subtasks.length > 0) {
      await tx.insert(subtasksTable).values(
        subtasks.map((s) => ({
          taskId: copy.id,
          title: s.title,
          completed: s.completed,
          completedAt: s.completedAt,
          orderFraction: s.orderFraction,
        })),
      );
    }
    const assignees = await tx
      .select({ userId: taskAssigneesTable.userId })
      .from(taskAssigneesTable)
      .where(eq(taskAssigneesTable.taskId, original.id));
    if (assignees.length > 0) {
      await tx
        .insert(taskAssigneesTable)
        .values(assignees.map((a) => ({ taskId: copy.id, userId: a.userId })));
    }
    return { task: copy, projectId: source.projectId };
  });
}

/** The first column of a board, and where a card goes at its end. */
export async function boardEntryPoint(projectId: string) {
  const [first] = await db
    .select({
      id: columnsTable.id,
      name: columnsTable.name,
      color: columnsTable.color,
    })
    .from(columnsTable)
    .where(
      and(
        eq(columnsTable.projectId, projectId),
        eq(columnsTable.isDeleted, false),
      ),
    )
    .orderBy(sql`${columnsTable.orderFraction} COLLATE "C"`)
    .limit(1);
  if (!first) return null;
  const [last] = await db
    .select({ orderFraction: tasksTable.orderFraction })
    .from(tasksTable)
    .where(eq(tasksTable.columnId, first.id))
    .orderBy(sql`${byteOrder} desc`)
    .limit(1);
  return {
    column: first,
    orderFraction: generateFractionBetween(last?.orderFraction ?? null, null),
  };
}

/** A board's labels, to drop the ones a moved card can't keep. */
export async function getProjectTags(projectId: string): Promise<string[]> {
  const [row] = await db
    .select({ tags: projectsTable.tags })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  return row?.tags ?? [];
}
