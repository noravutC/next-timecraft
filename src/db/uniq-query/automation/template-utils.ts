import { db } from '@/db';
import {
  subtasksTable,
  taskAssigneesTable,
  taskTemplatesTable,
  tasksTable,
} from '@/db/schema';
import { dueDateIn } from '@/helper/utils/automation-schedule';
import { assignBulkIndexes } from '@/helper/utils/fraction-string-indexing';
import type { SaveTemplatePayload, TaskRow, TaskTemplateRow } from '@/types';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { AutomationBoard } from './board-utils';
import { endOfColumn } from './task-action-utils';

const mine = (templateId: string, projectId: string) =>
  and(
    eq(taskTemplatesTable.id, templateId),
    eq(taskTemplatesTable.projectId, projectId),
  );

export async function listTemplates(
  projectId: string,
): Promise<TaskTemplateRow[]> {
  return db
    .select()
    .from(taskTemplatesTable)
    .where(eq(taskTemplatesTable.projectId, projectId))
    .orderBy(asc(taskTemplatesTable.createdAt));
}

export async function countTemplates(projectId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(taskTemplatesTable)
    .where(eq(taskTemplatesTable.projectId, projectId));
  return row?.n ?? 0;
}

export async function getTemplate(
  templateId: string,
  projectId: string,
): Promise<TaskTemplateRow | null> {
  const [row] = await db
    .select()
    .from(taskTemplatesTable)
    .where(mine(templateId, projectId));
  return row ?? null;
}

export async function insertTemplate(
  projectId: string,
  userId: string,
  payload: SaveTemplatePayload,
): Promise<TaskTemplateRow> {
  const [created] = await db
    .insert(taskTemplatesTable)
    .values({ ...payload, projectId, createdBy: userId })
    .returning();
  return created;
}

export async function updateTemplate(
  templateId: string,
  projectId: string,
  payload: Partial<SaveTemplatePayload>,
): Promise<TaskTemplateRow | null> {
  const [updated] = await db
    .update(taskTemplatesTable)
    .set({ ...payload, updatedAt: new Date() })
    .where(mine(templateId, projectId))
    .returning();
  return updated ?? null;
}

export async function deleteTemplate(
  templateId: string,
  projectId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(taskTemplatesTable)
    .where(mine(templateId, projectId))
    .returning({ id: taskTemplatesTable.id });
  return deleted.length > 0;
}

/**
 * A new task from a template, at the end of the column. People who left
 * the board and labels that were deleted are left out. `repeatRuleId` is
 * the schedule rule that asked for it, if one did.
 */
export async function createTaskFromTemplate(args: {
  template: TaskTemplateRow;
  columnId: string;
  board: AutomationBoard;
  now: Date;
  repeatRuleId?: string | null;
}): Promise<{ task: TaskRow; assigneeIds: string[]; subtasks: number }> {
  const { template, columnId, board, now } = args;
  const labels = new Set(board.labels);
  const members = new Set(board.members.map((m) => m.id));
  const assigneeIds = template.assigneeIds.filter((id) => members.has(id));
  const orderFraction = await endOfColumn(columnId);

  return db.transaction(async (tx) => {
    const [task] = await tx
      .insert(tasksTable)
      .values({
        columnId,
        title: template.title,
        description: template.description,
        priority: template.priority,
        tags: template.tags.filter((tag) => labels.has(tag)),
        dueDate:
          template.dueInDays === null
            ? null
            : dueDateIn(template.dueInDays, board.timeZone, now),
        orderFraction,
        repeatRuleId: args.repeatRuleId ?? null,
      })
      .returning();
    if (template.subtasks.length > 0) {
      await tx.insert(subtasksTable).values(
        assignBulkIndexes(
          // the key is filled in: in order, one after the other
          template.subtasks.map((title) => ({
            taskId: task.id,
            title,
            orderFraction: '',
          })),
        ),
      );
    }
    if (assigneeIds.length > 0) {
      await tx
        .insert(taskAssigneesTable)
        .values(assigneeIds.map((userId) => ({ taskId: task.id, userId })));
    }
    await tx
      .update(taskTemplatesTable)
      .set({ usedCount: sql`${taskTemplatesTable.usedCount} + 1` })
      .where(eq(taskTemplatesTable.id, template.id));
    return { task, assigneeIds, subtasks: template.subtasks.length };
  });
}
