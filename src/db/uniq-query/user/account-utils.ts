import { db } from '@/db';
import {
  aiSettingsTable,
  commentReadStateTable,
  membershipsTable,
  notificationsTable,
  organizationInvitationsTable,
  organizationsTable,
  projectInvitationsTable,
  projectMembersTable,
  projectsTable,
  taskActivitiesTable,
  taskAssigneesTable,
  taskCommentReactionsTable,
  usersTable,
} from '@/db/schema';
import { getAttachmentStoragePathsByProjectIds } from '@/db/uniq-query/comment/comment-utils';
import { pickHeir } from '@/helper/utils/heir';
import {
  mergePrefs,
  withPrefDefaults,
  type NotificationPrefs,
  type StoredNotificationPrefs,
} from '@/helper/utils/notification-prefs';
import { FORMER_MEMBER } from '@/helper/utils/person-name';
import type { AccountDeletionPlan, DeletionChoice } from '@/types';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const boardMembers = (tx: Tx, projectIds: string[]) =>
  projectIds.length === 0
    ? Promise.resolve([])
    : tx
        .select({
          projectId: projectMembersTable.projectId,
          userId: projectMembersTable.userId,
          role: projectMembersTable.role,
          joinedAt: projectMembersTable.joinedAt,
          name: usersTable.fullName,
        })
        .from(projectMembersTable)
        .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
        .where(inArray(projectMembersTable.projectId, projectIds));

/** The boards and workspace a user owns, and who would take each over. */
async function readPlan(tx: Tx, userId: string): Promise<AccountDeletionPlan> {
  const boards = await tx
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      coverImage: projectsTable.coverImage,
      settings: projectsTable.settings,
    })
    .from(projectsTable)
    .where(eq(projectsTable.ownerId, userId));
  const members = await boardMembers(
    tx,
    boards.map((b) => b.id),
  );

  const [owned] = await tx
    .select({
      id: organizationsTable.id,
      name: organizationsTable.name,
      logo: organizationsTable.logo,
    })
    .from(membershipsTable)
    .innerJoin(
      organizationsTable,
      eq(organizationsTable.id, membershipsTable.organizationId),
    )
    .where(
      and(
        eq(membershipsTable.userId, userId),
        eq(membershipsTable.role, 'owner'),
      ),
    )
    .limit(1);
  const workspaceMembers = owned
    ? await tx
        .select({
          userId: membershipsTable.userId,
          role: membershipsTable.role,
          joinedAt: membershipsTable.createdAt,
          name: usersTable.fullName,
        })
        .from(membershipsTable)
        .innerJoin(usersTable, eq(usersTable.id, membershipsTable.userId))
        .where(eq(membershipsTable.organizationId, owned.id))
    : [];

  const heirOf = <T extends { userId: string; name: string }>(
    candidate: T | null,
  ) => (candidate ? { id: candidate.userId, name: candidate.name } : null);

  return {
    boards: boards.map((board) => {
      const onBoard = members.filter((m) => m.projectId === board.id);
      return {
        ...board,
        memberCount: onBoard.length,
        heir: heirOf(pickHeir(onBoard, userId)),
      };
    }),
    workspace: owned
      ? {
          ...owned,
          memberCount: workspaceMembers.length,
          heir: heirOf(pickHeir(workspaceMembers, userId)),
        }
      : null,
  };
}

export const getAccountDeletionPlan = (userId: string) =>
  db.transaction((tx) => readPlan(tx, userId));

/**
 * Deletes an account. Owned boards and the owned workspace go to their heir
 * or are deleted, as chosen (deleted when nobody else is in them). The user
 * leaves every board and workspace, and the row is scrubbed rather than
 * removed, so comments and history keep an author: "Former member".
 * Returns the storage paths of files on the boards it deleted, for cleanup
 * once the transaction has committed.
 */
export async function deleteAccount(
  userId: string,
  choices: {
    boards: Record<string, DeletionChoice>;
    workspace?: DeletionChoice;
  },
): Promise<string[]> {
  return db.transaction(async (tx) => {
    const plan = await readPlan(tx, userId);
    const deletedBoards: string[] = [];

    for (const board of plan.boards) {
      if (board.heir && choices.boards[board.id] !== 'delete') {
        await tx
          .update(projectsTable)
          .set({ ownerId: board.heir.id, updatedAt: new Date() })
          .where(eq(projectsTable.id, board.id));
        await tx
          .update(projectMembersTable)
          .set({ role: 'owner', source: 'direct', updatedAt: new Date() })
          .where(
            and(
              eq(projectMembersTable.projectId, board.id),
              eq(projectMembersTable.userId, board.heir.id),
            ),
          );
      } else {
        deletedBoards.push(board.id);
      }
    }
    // the cascade takes the attachment rows, and their paths, with it
    const storagePaths = await getAttachmentStoragePathsByProjectIds(
      deletedBoards,
      tx,
    );
    if (deletedBoards.length > 0) {
      await tx
        .delete(projectsTable)
        .where(inArray(projectsTable.id, deletedBoards));
    }

    const workspace = plan.workspace;
    if (workspace?.heir && choices.workspace !== 'delete') {
      await tx
        .update(membershipsTable)
        .set({ role: 'owner', updatedAt: new Date() })
        .where(
          and(
            eq(membershipsTable.organizationId, workspace.id),
            eq(membershipsTable.userId, workspace.heir.id),
          ),
        );
      await tx
        .update(organizationsTable)
        .set({ createdBy: workspace.heir.id, updatedAt: new Date() })
        .where(eq(organizationsTable.id, workspace.id));
    } else if (workspace) {
      // its boards that others own stay with them, outside any workspace
      await tx
        .delete(organizationsTable)
        .where(eq(organizationsTable.id, workspace.id));
    }

    // leave everything
    await tx
      .delete(membershipsTable)
      .where(eq(membershipsTable.userId, userId));
    await tx
      .delete(projectMembersTable)
      .where(eq(projectMembersTable.userId, userId));
    await tx
      .delete(taskAssigneesTable)
      .where(eq(taskAssigneesTable.userId, userId));
    await tx
      .delete(taskCommentReactionsTable)
      .where(eq(taskCommentReactionsTable.userId, userId));
    await tx
      .delete(commentReadStateTable)
      .where(eq(commentReadStateTable.userId, userId));
    await tx
      .delete(notificationsTable)
      .where(eq(notificationsTable.userId, userId));
    await tx.delete(aiSettingsTable).where(eq(aiSettingsTable.userId, userId));
    for (const invitations of [
      projectInvitationsTable,
      organizationInvitationsTable,
    ]) {
      await tx
        .update(invitations)
        .set({ revokedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(invitations.invitedBy, userId),
            isNull(invitations.acceptedAt),
            isNull(invitations.revokedAt),
          ),
        );
    }

    // their name, kept as text in other people's notifications and history
    await tx
      .update(notificationsTable)
      .set({
        payload: sql`jsonb_set(${notificationsTable.payload}, '{actorName}', ${JSON.stringify(FORMER_MEMBER)}::jsonb)`,
      })
      .where(sql`${notificationsTable.payload}->>'actorUserId' = ${userId}`);
    const asRef = sql`jsonb_build_array(jsonb_build_object('id', ${userId}::text))`;
    const scrubList = (key: 'added' | 'removed') =>
      sql`coalesce((select jsonb_agg(case when e->>'id' = ${userId}::text then jsonb_build_object('id', e->>'id', 'name', ${FORMER_MEMBER}::text) else e end) from jsonb_array_elements(${taskActivitiesTable.data}->${key}) e), '[]'::jsonb)`;
    await tx
      .update(taskActivitiesTable)
      .set({
        data: sql`jsonb_build_object('added', ${scrubList('added')}, 'removed', ${scrubList('removed')})`,
      })
      .where(
        and(
          eq(taskActivitiesTable.type, 'assignees_changed'),
          sql`(${taskActivitiesTable.data}->'added' @> ${asRef} or ${taskActivitiesTable.data}->'removed' @> ${asRef})`,
        ),
      );

    await tx
      .update(usersTable)
      .set({
        fullName: FORMER_MEMBER,
        email: `deleted-${userId}@deleted.invalid`,
        avatar: null,
        provider: 'deleted',
        providerId: userId,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    return storagePaths;
  });
}

/** Changes the name shown on cards, comments and mentions. */
export async function updateDisplayName(userId: string, fullName: string) {
  const [user] = await db
    .update(usersTable)
    .set({ fullName, updatedAt: new Date() })
    .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
    .returning({ id: usersTable.id, fullName: usersTable.fullName });
  return user;
}

/** Saved notification settings, with the defaults filled in. */
export async function getNotificationPrefs(
  userId: string,
): Promise<NotificationPrefs> {
  const [row] = await db
    .select({ prefs: usersTable.notificationPrefs })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return withPrefDefaults(row?.prefs);
}

/** Merges a change into the saved settings and returns the result. */
export async function updateNotificationPrefs(
  userId: string,
  patch: StoredNotificationPrefs,
): Promise<NotificationPrefs> {
  const [row] = await db
    .select({ prefs: usersTable.notificationPrefs })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const merged = mergePrefs(row?.prefs ?? {}, patch);
  await db
    .update(usersTable)
    .set({ notificationPrefs: merged, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));
  return withPrefDefaults(merged);
}
