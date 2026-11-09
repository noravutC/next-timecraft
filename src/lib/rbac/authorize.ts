import { db } from '@/db';
import { projectMembersTable, projectsTable } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { ForbiddenError } from '@/lib/api/errors';
import { canAll, canAny, canOnBoard } from './can';
import { Permission, ProjectRole } from './permissions';

/** "all" = ต้องมีครบทุก permission (default), "any" = มีอันใดอันหนึ่งก็พอ */
export type AuthorizeMode = 'all' | 'any';

export interface AuthorizeOptions {
  mode?: AuthorizeMode;
}

/** ok, refused by role, or refused only because a board is archived */
type Verdict = 'ok' | 'denied' | 'archived';

const ARCHIVED_MESSAGE = 'This board is archived. Restore it to make changes.';

const roleAllows = (
  role: ProjectRole,
  permissions: Permission[],
  mode: AuthorizeMode,
) => (mode === 'any' ? canAny(role, permissions) : canAll(role, permissions));

const boardAllows = (
  role: ProjectRole,
  permissions: Permission[],
  mode: AuthorizeMode,
  board: { archived: boolean },
) => {
  const allowed = permissions.filter((p) => canOnBoard(role, p, board));
  return mode === 'any'
    ? allowed.length > 0
    : allowed.length === permissions.length;
};

async function evaluate(
  userId: string,
  projectIds: string[],
  permissions: Permission[],
  mode: AuthorizeMode,
): Promise<Verdict> {
  if (projectIds.length === 0 || permissions.length === 0) return 'denied';

  const memberships = await db
    .select({
      projectId: projectMembersTable.projectId,
      role: projectMembersTable.role,
      archived: projectsTable.archived,
    })
    .from(projectMembersTable)
    .innerJoin(
      projectsTable,
      eq(projectMembersTable.projectId, projectsTable.id),
    )
    .where(
      and(
        eq(projectMembersTable.userId, userId),
        inArray(projectMembersTable.projectId, projectIds),
      ),
    );

  if (memberships.length !== projectIds.length) return 'denied';
  if (!memberships.every((m) => roleAllows(m.role, permissions, mode))) {
    return 'denied';
  }
  return memberships.every((m) => boardAllows(m.role, permissions, mode, m))
    ? 'ok'
    : 'archived';
}

export async function authorize(
  userId: string,
  projectIds: string[],
  permission: Permission | Permission[],
  options: AuthorizeOptions = {},
): Promise<boolean> {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const verdict = await evaluate(
    userId,
    projectIds,
    permissions,
    options.mode ?? 'all',
  );
  return verdict === 'ok';
}

export async function authorizeOrThrow(
  userId: string,
  projectIds: string[],
  permission: Permission | Permission[],
  options: AuthorizeOptions = {},
): Promise<void> {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const verdict = await evaluate(
    userId,
    projectIds,
    permissions,
    options.mode ?? 'all',
  );
  if (verdict === 'archived') throw new ForbiddenError(ARCHIVED_MESSAGE);
  if (verdict !== 'ok') throw new ForbiddenError();
}
