import { db } from '@/db';
import { membershipsTable, organizationsTable } from '@/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

type OrganizationRow = typeof organizationsTable.$inferSelect;

export const toOrganizationCache = (organization: OrganizationRow) => ({
  ...organization,
  timestamp: Date.now(),
});

export async function getUserOrganizations(userId: string) {
  const rows = await db
    .select({ organization: organizationsTable })
    .from(membershipsTable)
    .innerJoin(
      organizationsTable,
      eq(membershipsTable.organizationId, organizationsTable.id),
    )
    .where(eq(membershipsTable.userId, userId))
    .orderBy(desc(organizationsTable.createdAt));
  return rows.map((row) => toOrganizationCache(row.organization));
}

/**
 * Create the user's one owned org. The per-user advisory lock serialises
 * concurrent requests so the "already owns one" check can't be raced.
 * Returns null when the user already owns an org.
 */
export async function createOwnedOrganization(
  userId: string,
  input: { name: string; description: string | null; logo: string | null },
): Promise<OrganizationRow | null> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`org-owner:${userId}`}))`,
    );

    const [owned] = await tx
      .select({ id: membershipsTable.id })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, userId),
          eq(membershipsTable.role, 'owner'),
        ),
      )
      .limit(1);
    if (owned) return null;

    const [organization] = await tx
      .insert(organizationsTable)
      .values({ ...input, createdBy: userId })
      .returning();
    await tx.insert(membershipsTable).values({
      userId,
      organizationId: organization.id,
      role: 'owner',
    });
    return organization;
  });
}
