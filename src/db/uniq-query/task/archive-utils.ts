import { db } from '@/db';
import { columnsTable, tasksTable, usersTable } from '@/db/schema';
import type { BoardArchive } from '@/types';
import { and, desc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

/**
 * A board's archive: archived tasks in its columns, and deleted columns
 * (with their tasks) that haven't been purged.
 */
export async function getBoardArchive(
  projectId: string,
): Promise<BoardArchive> {
  const archivedBy = alias(usersTable, 'archived_by_user');
  const tasks = await db
    .select({
      id: tasksTable.id,
      title: tasksTable.title,
      archivedAt: tasksTable.archivedAt,
      archivedByName: archivedBy.fullName,
      columnId: columnsTable.id,
      columnName: columnsTable.name,
      columnColor: columnsTable.color,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(columnsTable.id, tasksTable.columnId))
    .leftJoin(archivedBy, eq(archivedBy.id, tasksTable.archivedBy))
    .where(
      and(
        eq(columnsTable.projectId, projectId),
        eq(columnsTable.isDeleted, false),
        eq(tasksTable.archived, true),
      ),
    )
    .orderBy(
      desc(sql`coalesce(${tasksTable.archivedAt}, ${tasksTable.updatedAt})`),
    );

  const deletedBy = alias(usersTable, 'deleted_by_user');
  const columns = await db
    .select({
      id: columnsTable.id,
      name: columnsTable.name,
      color: columnsTable.color,
      deletedAt: columnsTable.deletedAt,
      deletedByName: deletedBy.fullName,
      purgeAt: columnsTable.purgeAt,
      taskCount: sql<number>`(select count(*)::int from ${tasksTable} t where t.column_id = ${columnsTable.id})`,
    })
    .from(columnsTable)
    .leftJoin(deletedBy, eq(deletedBy.id, columnsTable.deletedBy))
    .where(
      and(
        eq(columnsTable.projectId, projectId),
        eq(columnsTable.isDeleted, true),
      ),
    )
    .orderBy(desc(columnsTable.deletedAt));

  return { tasks, columns };
}
