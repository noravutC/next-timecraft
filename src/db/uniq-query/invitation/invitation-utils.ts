import { randomBytes } from "crypto";
import { db } from "@/db";
import { projectInvitationsTable, projectMembersTable } from "@/db/schema";
import type {
  InvitableRole,
  PendingInvitation,
  ProjectInvitationRow,
} from "@/types";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// pending = ยังไม่ accepted/revoked และยังไม่หมดอายุ (สถานะ derive จาก timestamps
// — ฝั่ง logic ล้วนดู invitationStatus() ใน src/helper/utils/invitation-status.ts)
const pendingCondition = () =>
  and(
    isNull(projectInvitationsTable.acceptedAt),
    isNull(projectInvitationsTable.revokedAt),
    gt(projectInvitationsTable.expiresAt, new Date()),
  );

export function toPendingInvitation(
  row: ProjectInvitationRow,
): PendingInvitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function getInvitationByToken(
  token: string,
): Promise<ProjectInvitationRow | undefined> {
  const [invitation] = await db
    .select()
    .from(projectInvitationsTable)
    .where(eq(projectInvitationsTable.token, token))
    .limit(1);
  return invitation;
}

export async function hasPendingInvitation(
  projectId: string,
  email: string,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: projectInvitationsTable.id })
    .from(projectInvitationsTable)
    .where(
      and(
        eq(projectInvitationsTable.projectId, projectId),
        eq(projectInvitationsTable.email, email),
        pendingCondition(),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

export async function listPendingInvitations(
  projectId: string,
): Promise<PendingInvitation[]> {
  const rows = await db
    .select()
    .from(projectInvitationsTable)
    .where(
      and(
        eq(projectInvitationsTable.projectId, projectId),
        pendingCondition(),
      ),
    )
    .orderBy(desc(projectInvitationsTable.createdAt));
  return rows.map(toPendingInvitation);
}

export async function createInvitation(args: {
  projectId: string;
  email: string;
  role: InvitableRole;
  invitedBy: string;
}): Promise<ProjectInvitationRow> {
  const [invitation] = await db
    .insert(projectInvitationsTable)
    .values({
      projectId: args.projectId,
      email: args.email,
      role: args.role,
      token: randomBytes(32).toString("hex"),
      invitedBy: args.invitedBy,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();
  return invitation;
}

// รับคำเชิญ: เพิ่ม member + stamp acceptedAt ใน transaction เดียว
export async function acceptInvitation(
  invitation: ProjectInvitationRow,
  userId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(projectMembersTable)
      .values({
        projectId: invitation.projectId,
        userId,
        role: invitation.role,
      })
      .onConflictDoNothing();
    await tx
      .update(projectInvitationsTable)
      .set({ acceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectInvitationsTable.id, invitation.id));
  });
}

export async function revokeInvitation(
  invitationId: string,
): Promise<{ id: string } | undefined> {
  const [revoked] = await db
    .update(projectInvitationsTable)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(projectInvitationsTable.id, invitationId))
    .returning({ id: projectInvitationsTable.id });
  return revoked;
}
