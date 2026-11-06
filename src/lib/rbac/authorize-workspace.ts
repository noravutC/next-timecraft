import { getOrgRole } from '@/db/uniq-query/project/project-utils';
import { ForbiddenError } from '@/lib/api/errors';
import {
  canManageWorkspace,
  type WorkspaceRole,
} from './workspace-permissions';

/**
 * The caller's role in a workspace, or a 403: 'view' needs any membership,
 * 'manage' needs the owner or an admin.
 */
export async function authorizeWorkspace(
  userId: string,
  organizationId: string,
  need: 'view' | 'manage',
): Promise<WorkspaceRole> {
  const role = await getOrgRole(userId, organizationId);
  if (!role) throw new ForbiddenError('You’re not in this workspace');
  if (need === 'manage' && !canManageWorkspace(role)) {
    throw new ForbiddenError('Only the owner and admins can do this');
  }
  return role;
}
