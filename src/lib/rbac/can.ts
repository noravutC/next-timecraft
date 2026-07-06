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
