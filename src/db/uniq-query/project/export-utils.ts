import { db } from '@/db';
import {
  columnsTable,
  organizationsTable,
  projectsTable,
  subtasksTable,
  taskAssigneesTable,
  taskCommentAttachmentsTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from '@/db/schema';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

/**
 * Everything on a board, for Export: its columns, and every task (archived
 * ones included) with its people, subtasks and comments. Attachments come
 * as names and sizes; the files stay in storage.
 */
export async function getBoardExport(projectId: string) {
  const [board] = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      tags: projectsTable.tags,
      // due dates are written as days in this zone
      timeZone: organizationsTable.timeZone,
    })
    .from(projectsTable)
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    )
    .where(eq(projectsTable.id, projectId));
  if (!board) return null;

  const columns = await db
    .select({
      id: columnsTable.id,
      name: columnsTable.name,
      color: columnsTable.color,
      wipLimit: columnsTable.wipLimit,
    })
    .from(columnsTable)
    .where(
      and(
        eq(columnsTable.projectId, projectId),
        eq(columnsTable.isDeleted, false),
      ),
    )
    .orderBy(sql`${columnsTable.orderFraction} COLLATE "C"`);
  const columnIds = columns.map((c) => c.id);
  if (columnIds.length === 0) return { board, columns, tasks: [] };

  const tasks = await db
    .select({
      id: tasksTable.id,
      columnId: tasksTable.columnId,
      title: tasksTable.title,
      description: tasksTable.description,
      priority: tasksTable.priority,
      tags: tasksTable.tags,
      dueDate: tasksTable.dueDate,
      estimatedHours: tasksTable.estimatedHours,
      loggedMinutes: tasksTable.loggedMinutes,
      archived: tasksTable.archived,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    })
    .from(tasksTable)
    .where(inArray(tasksTable.columnId, columnIds))
    .orderBy(
      asc(tasksTable.columnId),
      sql`${tasksTable.orderFraction} COLLATE "C"`,
    );
  const taskIds = tasks.map((t) => t.id);
  if (taskIds.length === 0) return { board, columns, tasks: [] };

  const [assignees, subtasks, comments] = await Promise.all([
    db
      .select({ taskId: taskAssigneesTable.taskId, name: usersTable.fullName })
      .from(taskAssigneesTable)
      .innerJoin(usersTable, eq(usersTable.id, taskAssigneesTable.userId))
      .where(inArray(taskAssigneesTable.taskId, taskIds)),
    db
      .select({
        taskId: subtasksTable.taskId,
        title: subtasksTable.title,
        completed: subtasksTable.completed,
      })
      .from(subtasksTable)
      .where(inArray(subtasksTable.taskId, taskIds))
      .orderBy(sql`${subtasksTable.orderFraction} COLLATE "C"`),
    db
      .select({
        id: taskCommentsTable.id,
        taskId: taskCommentsTable.taskId,
        author: usersTable.fullName,
        body: taskCommentsTable.body,
        createdAt: taskCommentsTable.createdAt,
      })
      .from(taskCommentsTable)
      .leftJoin(usersTable, eq(usersTable.id, taskCommentsTable.userId))
      .where(
        and(
          inArray(taskCommentsTable.taskId, taskIds),
          isNull(taskCommentsTable.deletedAt),
        ),
      )
      .orderBy(asc(taskCommentsTable.createdAt)),
  ]);
  const attachments = comments.length
    ? await db
        .select({
          commentId: taskCommentAttachmentsTable.commentId,
          fileName: taskCommentAttachmentsTable.fileName,
          type: taskCommentAttachmentsTable.type,
          sizeBytes: taskCommentAttachmentsTable.sizeBytes,
        })
        .from(taskCommentAttachmentsTable)
        .where(
          inArray(
            taskCommentAttachmentsTable.commentId,
            comments.map((c) => c.id),
          ),
        )
    : [];

  return {
    board,
    columns,
    tasks: tasks.map((task) => ({
      ...task,
      assignees: assignees
        .filter((a) => a.taskId === task.id)
        .map((a) => a.name),
      subtasks: subtasks
        .filter((s) => s.taskId === task.id)
        .map(({ title, completed }) => ({ title, completed })),
      comments: comments
        .filter((c) => c.taskId === task.id)
        .map(({ id, author, body, createdAt }) => ({
          author: author ?? 'Former member',
          body,
          createdAt,
          attachments: attachments
            .filter((a) => a.commentId === id)
            .map(({ fileName, type, sizeBytes }) => ({
              fileName,
              type,
              sizeBytes,
            })),
        })),
    })),
  };
}

export type BoardExport = NonNullable<
  Awaited<ReturnType<typeof getBoardExport>>
>;
