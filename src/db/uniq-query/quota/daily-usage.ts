import { db } from '@/db';
import {
  aiUsageLogsTable,
  projectInvitationsTable,
  projectsTable,
} from '@/db/schema';
import { and, count, eq, gte } from 'drizzle-orm';

// Counts behind the daily ceilings in lib/api/quotas.ts. They read rows the
// actions already write, so the limits survive restarts without new tables.

export async function countInvitesSentSince(
  userId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(projectInvitationsTable)
    .where(
      and(
        eq(projectInvitationsTable.invitedBy, userId),
        gte(projectInvitationsTable.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}

export async function countBoardsCreatedSince(
  userId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(projectsTable)
    .where(
      and(
        eq(projectsTable.ownerId, userId),
        gte(projectsTable.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}

export async function countAiUsageByUserSince(
  userId: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(aiUsageLogsTable)
    .where(
      and(
        eq(aiUsageLogsTable.userId, userId),
        gte(aiUsageLogsTable.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}
