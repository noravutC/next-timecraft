import { randomBytes } from 'crypto';
import { db } from '@/db';
import { membershipsTable, organizationInvitationsTable } from '@/db/schema';
import { INVITE_TTL_MS } from '@/db/uniq-query/invitation/invitation-utils';
import type { WorkspaceInvitableRole } from '@/lib/rbac/workspace-permissions';
import type {
  OrganizationInvitationRow,
  PendingWorkspaceInvitation,
} from '@/types';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { grantWorkspaceBoards } from './organization-utils';

// pending = not accepted or revoked, and not expired (invitationStatus() in
// helper/utils/invitation-status.ts reads the same timestamps)
const pendingCondition = () =>
  and(
    isNull(organizationInvitationsTable.acceptedAt),
    isNull(organizationInvitationsTable.revokedAt),
    gt(organizationInvitationsTable.expiresAt, new Date()),
  );

export const toPendingWorkspaceInvitation = (
  row: OrganizationInvitationRow,
): PendingWorkspaceInvitation => ({
  id: row.id,
  email: row.email,
  role: row.role,
  token: row.token,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
});

export async function getWorkspaceInvitationByToken(
  token: string,
): Promise<OrganizationInvitationRow | undefined> {
  const [invitation] = await db
    .select()
    .from(organizationInvitationsTable)
    .where(eq(organizationInvitationsTable.token, token))
    .limit(1);
  return invitation;
}

export async function hasPendingWorkspaceInvitation(
  organizationId: string,
  email: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: organizationInvitationsTable.id })
    .from(organizationInvitationsTable)
    .where(
      and(
        eq(organizationInvitationsTable.organizationId, organizationId),
        eq(organizationInvitationsTable.email, email),
        pendingCondition(),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

export async function createWorkspaceInvitation(args: {
  organizationId: string;
  email: string;
  role: WorkspaceInvitableRole;
  invitedBy: string;
}): Promise<OrganizationInvitationRow> {
  const [invitation] = await db
    .insert(organizationInvitationsTable)
    .values({
      organizationId: args.organizationId,
      email: args.email,
      role: args.role,
      token: randomBytes(32).toString('hex'),
      invitedBy: args.invitedBy,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();
  return invitation;
}

/**
 * Claims the invitation while it is still pending, adds the membership and
 * seats the new member on the workspace's boards, all in one transaction.
 * False when the invitation was no longer usable at the moment of claiming.
 */
export async function acceptWorkspaceInvitation(
  invitation: OrganizationInvitationRow,
  userId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(organizationInvitationsTable)
      .set({ acceptedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(organizationInvitationsTable.id, invitation.id),
          pendingCondition(),
        ),
      )
      .returning({ id: organizationInvitationsTable.id });
    if (!claimed) return false;

    await tx
      .insert(membershipsTable)
      .values({
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      })
      .onConflictDoNothing();
    // someone already in the workspace keeps the role they have
    const [membership] = await tx
      .select({ role: membershipsTable.role })
      .from(membershipsTable)
      .where(
        and(
          eq(membershipsTable.userId, userId),
          eq(membershipsTable.organizationId, invitation.organizationId),
        ),
      )
      .limit(1);
    await grantWorkspaceBoards(tx, {
      userId,
      organizationId: invitation.organizationId,
      role: membership?.role ?? invitation.role,
    });
    return true;
  });
}
