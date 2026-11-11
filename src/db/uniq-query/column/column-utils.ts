import { db } from '@/db';
import { columnsTable } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

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

// columns in the archive (deleted, not yet purged), for restoring
export async function getDeletedColumnLinks(columnIds: string[]) {
  if (columnIds.length === 0) return [];
  return db
    .select({ columnId: columnsTable.id, projectId: columnsTable.projectId })
    .from(columnsTable)
    .where(
      and(
        inArray(columnsTable.id, columnIds),
        eq(columnsTable.isDeleted, true),
      ),
    );
}

/** Brings deleted columns back where they were, with their tasks. */
export async function restoreColumns(columnIds: string[]) {
  if (columnIds.length === 0) return [];
  return db
    .update(columnsTable)
    .set({
      isDeleted: false,
      // a restored Done column stays Done unless the board got another
      // one while it was in the archive
      isDone: sql`${columnsTable.isDone} AND NOT EXISTS (
        SELECT 1 FROM columns other
        WHERE other.project_id = ${columnsTable.projectId}
          AND other.is_done AND NOT other.is_deleted
          AND other.id <> ${columnsTable.id}
      )`,
      deletedAt: null,
      deletedBy: null,
      purgeAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(columnsTable.id, columnIds),
        eq(columnsTable.isDeleted, true),
      ),
    )
    .returning();
}
