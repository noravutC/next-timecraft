import { db } from '@/db';
import {
  membershipsTable,
  organizationsTable,
  projectMembersTable,
  projectsTable,
} from '@/db/schema';
import {
  boardRoleForWorkspaceRole,
  type WorkspaceRole,
} from '@/lib/rbac/workspace-permissions';
import type { Member } from '@/types';
import { and, desc, eq, ne, sql } from 'drizzle-orm';

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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * A new workspace member gets a seat on every board in the workspace.
 * Boards they were already invited to keep the role they have there.
 */
export async function grantWorkspaceBoards(
  tx: Tx,
  args: { userId: string; organizationId: string; role: WorkspaceRole },
): Promise<void> {
  const boards = await tx
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.organizationId, args.organizationId));
  if (boards.length === 0) return;
  await tx
    .insert(projectMembersTable)
    .values(
      boards.map((board) => ({
        projectId: board.id,
        userId: args.userId,
        role: boardRoleForWorkspaceRole(args.role),
        source: 'workspace' as const,
      })),
    )
    .onConflictDoNothing();
}

/** Seats every member of the workspace, but its creator, on a new board. */
export async function shareBoardWithWorkspace(
  tx: Tx,
  args: { projectId: string; organizationId: string; creatorId: string },
): Promise<Member[]> {
  const members = await tx
    .select({ userId: membershipsTable.userId, role: membershipsTable.role })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.organizationId, args.organizationId),
        ne(membershipsTable.userId, args.creatorId),
      ),
    );
  if (members.length === 0) return [];
  return tx
    .insert(projectMembersTable)
    .values(
      members.map((member) => ({
        projectId: args.projectId,
        userId: member.userId,
        role: boardRoleForWorkspaceRole(member.role),
        source: 'workspace' as const,
      })),
    )
    .onConflictDoNothing()
    .returning({
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      joinedAt: projectMembersTable.joinedAt,
    });
}

/** Name and logo, for invitation pages and emails. */
export async function getWorkspaceSummary(
  organizationId: string,
): Promise<{ name: string; logo: string | null } | undefined> {
  const [row] = await db
    .select({ name: organizationsTable.name, logo: organizationsTable.logo })
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId))
    .limit(1);
  return row;
}
