import { db } from '@/db';
import {
  columnsTable,
  taskCommentAttachmentsTable,
  taskCommentsTable,
  tasksTable,
} from '@/db/schema';
import { and, eq, inArray, lte } from 'drizzle-orm';

/**
 * Deletes for good the columns whose 30 days in the archive are up, with
 * their tasks. Returns the storage paths of their files, to remove.
 */
export async function purgeExpiredColumns(now: Date): Promise<{
  purged: number;
  storagePaths: string[];
}> {
  const expired = await db
    .select({ id: columnsTable.id })
    .from(columnsTable)
    .where(
      and(eq(columnsTable.isDeleted, true), lte(columnsTable.purgeAt, now)),
    );
  const ids = expired.map((c) => c.id);
  if (ids.length === 0) return { purged: 0, storagePaths: [] };

  const files = await db
    .select({ storagePath: taskCommentAttachmentsTable.storagePath })
    .from(taskCommentAttachmentsTable)
    .innerJoin(
      taskCommentsTable,
      eq(taskCommentsTable.id, taskCommentAttachmentsTable.commentId),
    )
    .innerJoin(tasksTable, eq(tasksTable.id, taskCommentsTable.taskId))
    .where(inArray(tasksTable.columnId, ids));
  await db.delete(columnsTable).where(inArray(columnsTable.id, ids));
  return { purged: ids.length, storagePaths: files.map((f) => f.storagePath) };
}
