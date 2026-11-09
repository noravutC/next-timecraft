import { db } from '@/db';
import {
  columnsTable,
  projectMembersTable,
  projectsTable,
  taskCommentsTable,
  tasksTable,
  usersTable,
} from '@/db/schema';
import { escapeLike, snippetAround } from '@/helper/utils/search';
import type { TaskSearchHit } from '@/types';
import { and, desc, eq, ilike, isNull, notInArray, or, sql } from 'drizzle-orm';

/**
 * Tasks on your boards whose title, description or a comment holds the
 * query: title matches first, then descriptions, then comments.
 */
export async function searchTasks(args: {
  userId: string;
  query: string;
  projectId: string | null;
  limit: number;
}): Promise<TaskSearchHit[]> {
  const pattern = `%${escapeLike(args.query)}%`;
  const onYourBoards = and(
    eq(projectMembersTable.userId, args.userId),
    eq(columnsTable.isDeleted, false),
    eq(tasksTable.archived, false),
    args.projectId ? eq(projectsTable.id, args.projectId) : undefined,
  );
  const fields = {
    taskId: tasksTable.id,
    title: tasksTable.title,
    description: tasksTable.description,
    projectId: projectsTable.id,
    projectName: projectsTable.name,
    coverImage: projectsTable.coverImage,
    settings: projectsTable.settings,
    columnName: columnsTable.name,
    columnColor: columnsTable.color,
  };
  const inText = await db
    .select(fields)
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .innerJoin(projectsTable, eq(projectsTable.id, columnsTable.projectId))
    .innerJoin(
      projectMembersTable,
      eq(projectMembersTable.projectId, projectsTable.id),
    )
    .where(
      and(
        onYourBoards,
        or(
          ilike(tasksTable.title, pattern),
          ilike(tasksTable.description, pattern),
        ),
      ),
    )
    .orderBy(
      desc(sql`${tasksTable.title} ilike ${pattern}`),
      desc(tasksTable.updatedAt),
    )
    .limit(args.limit);

  const hits: TaskSearchHit[] = inText.map((row) => {
    const inTitle = row.title.toLowerCase().includes(args.query.toLowerCase());
    return {
      ...row,
      match: inTitle ? 'title' : 'description',
      snippet: inTitle
        ? null
        : snippetAround(row.description ?? '', args.query),
    };
  });
  if (hits.length >= args.limit) return hits;

  const found = hits.map((h) => h.taskId);
  const inComments = await db
    .selectDistinctOn([tasksTable.id], {
      ...fields,
      body: taskCommentsTable.body,
      author: usersTable.fullName,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .innerJoin(projectsTable, eq(projectsTable.id, columnsTable.projectId))
    .innerJoin(
      projectMembersTable,
      eq(projectMembersTable.projectId, projectsTable.id),
    )
    .innerJoin(taskCommentsTable, eq(taskCommentsTable.taskId, tasksTable.id))
    .innerJoin(usersTable, eq(usersTable.id, taskCommentsTable.userId))
    .where(
      and(
        onYourBoards,
        isNull(taskCommentsTable.deletedAt),
        ilike(taskCommentsTable.body, pattern),
        found.length > 0 ? notInArray(tasksTable.id, found) : undefined,
      ),
    )
    .orderBy(tasksTable.id, desc(taskCommentsTable.createdAt))
    .limit(args.limit - hits.length);

  return [
    ...hits,
    ...inComments.map(({ body, author, ...row }) => ({
      ...row,
      match: 'comment' as const,
      snippet: `${author}: ${snippetAround(body, args.query)}`,
    })),
  ];
}
