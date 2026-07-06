import { db } from '@/db';
import { projectMembersTable, projectsTable } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { ForbiddenError } from '@/lib/api/errors';
import { canAll, canAny } from './can';
import { Permission } from './permissions';

/** "all" = ต้องมีครบทุก permission (default), "any" = มีอันใดอันหนึ่งก็พอ */
export type AuthorizeMode = 'all' | 'any';

export interface AuthorizeOptions {
  mode?: AuthorizeMode;
}

export async function authorize(
  userId: string,
  projectIds: string[],
  permission: Permission | Permission[],
  options: AuthorizeOptions = {},
): Promise<boolean> {
  const { mode = 'all' } = options;
  const permissions = Array.isArray(permission) ? permission : [permission];
  if (projectIds.length === 0 || permissions.length === 0) return false;

  const memberships = await db
    .select({
      projectId: projectMembersTable.projectId,
      role: projectMembersTable.role,
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

  if (memberships.length !== projectIds.length) return false;
  return memberships.every((m) =>
    mode === 'any' ? canAny(m.role, permissions) : canAll(m.role, permissions),
  );
}

export async function authorizeOrThrow(
  userId: string,
  projectIds: string[],
  permission: Permission | Permission[],
  options: AuthorizeOptions = {},
): Promise<void> {
  const ok = await authorize(userId, projectIds, permission, options);
  if (!ok) throw new ForbiddenError();
}
