import { db } from '@/db';
import { columnsTable, tasksTable } from '@/db/schema';
import { renameTagsIn, type TagRenames } from '@/helper/utils/tag-rename';
import { and, arrayOverlaps, eq, inArray, sql } from 'drizzle-orm';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Renames tags on every task of a board, archived ones and those in deleted
 * columns included, so a restore brings back the new names. Returns how
 * many tasks changed.
 */
export async function renameBoardTags(
  tx: Tx,
  projectId: string,
  renames: TagRenames,
): Promise<number> {
  const from = Object.keys(renames);
  if (from.length === 0) return 0;
  const rows = await tx
    .select({ id: tasksTable.id, tags: tasksTable.tags })
    .from(tasksTable)
    .where(
      and(
        inArray(
          tasksTable.columnId,
          tx
            .select({ id: columnsTable.id })
            .from(columnsTable)
            .where(eq(columnsTable.projectId, projectId)),
        ),
        arrayOverlaps(tasksTable.tags, from),
      ),
    );
  for (const row of rows) {
    await tx
      .update(tasksTable)
      .set({ tags: renameTagsIn(row.tags, renames) })
      .where(eq(tasksTable.id, row.id));
  }
  return rows.length;
}

/** How many live tasks on the board carry each tag. */
export async function countBoardTags(
  projectId: string,
): Promise<Record<string, number>> {
  const rows = await db.execute<{ tag: string; n: number }>(sql`
    select tag, count(*)::int as n
    from ${tasksTable} t
    cross join lateral unnest(t.tags) as tag
    where t.archived = false
      and t.column_id in (
        select id from ${columnsTable}
        where project_id = ${projectId} and is_deleted = false
      )
    group by tag
  `);
  return Object.fromEntries(rows.map((r) => [r.tag, r.n]));
}
