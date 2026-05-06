import { Permission, ProjectRole, ROLE_PERMISSIONS } from "./permissions";

export function can(role: ProjectRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}
