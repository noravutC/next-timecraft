import { db } from '@/db';
import {
  membershipsTable,
  projectMembersTable,
  projectsTable,
  usersTable,
} from '@/db/schema';
import {
  boardRoleForWorkspaceRole,
  type WorkspaceInvitableRole,
} from '@/lib/rbac/workspace-permissions';
import type { BoardGuest, WorkspaceMember } from '@/types';
import { and, asc, eq, inArray, ne, notExists, sql } from 'drizzle-orm';
import { grantWorkspaceBoards } from './organization-utils';

const boardsOf = (organizationId: string) =>
  db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.organizationId, organizationId));

/** Every board in the workspace, to tell their members something changed. */
export async function listWorkspaceBoardIds(
  organizationId: string,
): Promise<string[]> {
  return (await boardsOf(organizationId)).map((board) => board.id);
}

/** Everyone in the workspace, with how many of its boards they're on. */
export async function listWorkspaceMembers(
  organizationId: string,
): Promise<WorkspaceMember[]> {
  return db
    .select({
      userId: membershipsTable.userId,
      fullName: usersTable.fullName,
      email: usersTable.email,
      avatar: usersTable.avatar,
      role: membershipsTable.role,
      joinedAt: membershipsTable.createdAt,
      boardCount: sql<number>`(select count(*)::int from ${projectMembersTable} pm join ${projectsTable} p on p.id = pm.project_id where pm.user_id = ${membershipsTable.userId} and p.organization_id = ${organizationId})`,
    })
    .from(membershipsTable)
    .innerJoin(usersTable, eq(usersTable.id, membershipsTable.userId))
    .where(eq(membershipsTable.organizationId, organizationId))
    .orderBy(asc(membershipsTable.createdAt));
}

/** People on the workspace's boards who aren't in the workspace itself. */
export async function listBoardGuests(
  organizationId: string,
): Promise<BoardGuest[]> {
  const rows = await db
    .select({
      userId: projectMembersTable.userId,
      fullName: usersTable.fullName,
      email: usersTable.email,
      avatar: usersTable.avatar,
      projectId: projectsTable.id,
      boardName: projectsTable.name,
      role: projectMembersTable.role,
    })
    .from(projectMembersTable)
    .innerJoin(
      projectsTable,
      eq(projectsTable.id, projectMembersTable.projectId),
    )
    .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
    .where(
      and(
        eq(projectsTable.organizationId, organizationId),
        notExists(
          db
            .select({ id: membershipsTable.id })
            .from(membershipsTable)
            .where(
              and(
                eq(membershipsTable.organizationId, organizationId),
                eq(membershipsTable.userId, projectMembersTable.userId),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(usersTable.fullName));

  const byUser = new Map<string, BoardGuest>();
  for (const row of rows) {
    const guest = byUser.get(row.userId) ?? {
      userId: row.userId,
      fullName: row.fullName,
      email: row.email,
      avatar: row.avatar,
      boards: [],
    };
    guest.boards.push({
      projectId: row.projectId,
      name: row.boardName,
      role: row.role,
    });
    byUser.set(row.userId, guest);
  }
  return [...byUser.values()];
}

/**
 * Changes a member's workspace role, and with it the role their
 * membership gives on each board. The owner's role doesn't change here.
 * False when they aren't a (non-owner) member.
 */
export async function changeWorkspaceRole(
  organizationId: string,
  userId: string,
  role: WorkspaceInvitableRole,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [changed] = await tx
      .update(membershipsTable)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
          ne(membershipsTable.role, 'owner'),
        ),
      )
      .returning({ id: membershipsTable.id });
    if (!changed) return false;
    await tx
      .update(projectMembersTable)
      .set({ role: boardRoleForWorkspaceRole(role), updatedAt: new Date() })
      .where(
        and(
          eq(projectMembersTable.userId, userId),
          eq(projectMembersTable.source, 'workspace'),
          inArray(projectMembersTable.projectId, boardsOf(organizationId)),
        ),
      );
    return true;
  });
}

/**
 * Takes someone out of the workspace: the membership, and the board seats
 * it gave them. Boards they were invited to directly stay. The owner can't
 * be removed. False when they aren't a (non-owner) member.
 */
export async function removeWorkspaceMember(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(membershipsTable)
      .where(
        and(
          eq(membershipsTable.organizationId, organizationId),
          eq(membershipsTable.userId, userId),
          ne(membershipsTable.role, 'owner'),
        ),
      )
      .returning({ id: membershipsTable.id });
    if (!removed) return false;
    await tx
      .delete(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.userId, userId),
          eq(projectMembersTable.source, 'workspace'),
          inArray(projectMembersTable.projectId, boardsOf(organizationId)),
        ),
      );
    return true;
  });
}

/**
 * Makes a board guest a member of the workspace, with a seat on all of
 * its boards. False when they aren't on any of its boards, or already in.
 */
export async function addGuestToWorkspace(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const guests = await listBoardGuests(organizationId);
  if (!guests.some((g) => g.userId === userId)) return false;
  return db.transaction(async (tx) => {
    const [added] = await tx
      .insert(membershipsTable)
      .values({ userId, organizationId, role: 'member' })
      .onConflictDoNothing()
      .returning({ id: membershipsTable.id });
    if (!added) return false;
    await grantWorkspaceBoards(tx, { userId, organizationId, role: 'member' });
    return true;
  });
}
