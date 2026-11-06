import { db } from '@/db';
import { columnsTable } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

/**
 * columnId → projectId for columns that are not soft-deleted.
 * Deleted columns are treated as missing so nothing can be read from,
 * written to, or moved into the trash.
 */
export async function getActiveColumnLinks(columnIds: string[]) {
  if (columnIds.length === 0) return [];
  return db
    .select({ columnId: columnsTable.id, projectId: columnsTable.projectId })
    .from(columnsTable)
    .where(
      and(
        inArray(columnsTable.id, columnIds),
        eq(columnsTable.isDeleted, false),
      ),
    );
}
