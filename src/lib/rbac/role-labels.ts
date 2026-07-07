import type { ProjectRole } from '@/lib/rbac/permissions';
import type { InvitableRole } from '@/types';

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

// ลำดับตาม design ของ invite dialog — Editor เป็นค่า default
export const INVITABLE_ROLES: readonly InvitableRole[] = [
  'editor',
  'viewer',
  'admin',
];
