import { Permission, ProjectRole, ROLE_PERMISSIONS } from './permissions';

export function can(role: ProjectRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** true เมื่อ role มีครบทุก permission ในลิสต์ */
export function canAll(role: ProjectRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => can(role, permission));
}

/** true เมื่อ role มีอย่างน้อยหนึ่ง permission ในลิสต์ */
export function canAny(role: ProjectRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

/** true เมื่อ actor อยู่สูงกว่า target จริงๆ (admin เหนือ editor ได้ แต่ admin เหนือ admin ไม่ได้) */
export function outranks(actor: ProjectRole, target: ProjectRole): boolean {
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
