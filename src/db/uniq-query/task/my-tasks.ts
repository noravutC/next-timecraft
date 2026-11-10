import { db } from '@/db';
import {
  columnsTable,
  projectMembersTable,
  projectsTable,
  taskAssigneesTable,
  tasksTable,
} from '@/db/schema';
import { fetchAssigneesForTasks } from '@/db/uniq-query/task/assignee-utils';
import { fetchBlockerRefs } from '@/db/uniq-query/task/dependency-utils';
import { finishColumnOf, isBlocked } from '@/helper/utils/task-blocked';
import type { MyTask } from '@/types';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * Open work assigned to you on every board you're still on: not archived,
 * not on an archived board. `finished` marks tasks in a board's last
 * column; the page hides them until "Show done".
 */
export async function listMyTasks(userId: string): Promise<MyTask[]> {
  const rows = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      priority: tasksTable.priority,
      dueDate: tasksTable.dueDate,
      projectId: columnsTable.projectId,
      columnId: columnsTable.id,
      columnName: columnsTable.name,
      columnColor: columnsTable.color,
    })
    .from(taskAssigneesTable)
    .innerJoin(tasksTable, eq(tasksTable.id, taskAssigneesTable.taskId))
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .innerJoin(projectsTable, eq(projectsTable.id, columnsTable.projectId))
    .innerJoin(
      projectMembersTable,
      and(
        eq(projectMembersTable.projectId, projectsTable.id),
        eq(projectMembersTable.userId, userId),
      ),
    )
    .where(
      and(
        eq(taskAssigneesTable.userId, userId),
        eq(tasksTable.archived, false),
        eq(columnsTable.isDeleted, false),
        eq(projectsTable.archived, false),
      ),
    );
  if (rows.length === 0) return [];

  const taskIds = rows.map((r) => r.id);
  const projectIds = [...new Set(rows.map((r) => r.projectId))];
  const [columns, assignees, blockers] = await Promise.all([
    db
      .select({
        id: columnsTable.id,
        projectId: columnsTable.projectId,
        orderFraction: columnsTable.orderFraction,
      })
      .from(columnsTable)
      .where(
        and(
          inArray(columnsTable.projectId, projectIds),
          eq(columnsTable.isDeleted, false),
        ),
      ),
    fetchAssigneesForTasks(taskIds),
    fetchBlockerRefs(taskIds),
  ]);
  const finishOf = new Map(
    projectIds.map((id) => [id, finishColumnOf(columns, id)]),
  );

  // grouped once: filtering the whole list per task is quadratic
  const assigneesOf = new Map<string, MyTask['assignees']>();
  for (const { taskId, userId: id, fullName, avatar } of assignees) {
    const list = assigneesOf.get(taskId) ?? [];
    list.push({ userId: id, fullName, avatar });
    assigneesOf.set(taskId, list);
  }

  return rows.map((row) => {
    const finish = finishOf.get(row.projectId) ?? null;
    return {
      ...row,
      finished: row.columnId === finish,
      blocked: isBlocked(blockers[row.id], {}, finish),
      assignees: assigneesOf.get(row.id) ?? [],
    };
  });
}
